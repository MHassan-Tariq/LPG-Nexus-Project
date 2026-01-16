import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Core utilities
import { createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

// Hardcoded Gemini API Key
const GEMINI_API_KEY = "AIzaSyBT4XoQ1QbfWprKmsdNESl5W9YQsIaC5Is";

// Initialize Gemini client
function getGeminiClient() {
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

// Detect intent from user message
function detectIntent(message: string): { intent: string; params: any } {
  const lowerMessage = message.toLowerCase();

  // Customer queries
  if (lowerMessage.includes("total customers") || lowerMessage.includes("how many customers")) {
    return { intent: "get_customers_count", params: {} };
  }
  if (lowerMessage.includes("customer") && (lowerMessage.includes("detail") || lowerMessage.includes("info") || lowerMessage.includes("balance"))) {
    // Extract customer code or name
    const codeMatch = message.match(/customer\s*(?:code\s*)?(\d+)|code\s*(\d+)/i);
    const nameMatch = message.match(/customer\s+(\w+(?:\s+\w+)?)|name\s+(\w+(?:\s+\w+)?)/i);
    return {
      intent: "get_customer_details",
      params: {
        customerCode: codeMatch ? (codeMatch[1] || codeMatch[2]) : null,
        customerName: nameMatch ? (nameMatch[1] || nameMatch[2]) : null,
      },
    };
  }

  // Inventory queries
  if (lowerMessage.includes("inventory") || (lowerMessage.includes("stock") && lowerMessage.includes("status"))) {
    return { intent: "get_inventory_status", params: {} };
  }
  if (lowerMessage.includes("low stock") || lowerMessage.includes("out of stock")) {
    return { intent: "get_low_stock", params: {} };
  }

  // Sales queries
  if ((lowerMessage.includes("today") || lowerMessage.includes("todays")) && (lowerMessage.includes("sales") || lowerMessage.includes("revenue"))) {
    return { intent: "get_todays_sales", params: {} };
  }

  // Payment queries
  if (lowerMessage.includes("pending") && lowerMessage.includes("payment")) {
    return { intent: "get_pending_payments", params: {} };
  }

  // Delivery queries
  if ((lowerMessage.includes("today") || lowerMessage.includes("todays")) && (lowerMessage.includes("delivery") || lowerMessage.includes("deliver"))) {
    return { intent: "get_todays_deliveries", params: {} };
  }

  // Default - general query
  return { intent: "general", params: {} };
}

async function getDatabaseData(intent: string, params: any): Promise<any> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (intent) {
      case "get_customers_count":
        const customerCount = await prisma.customer.count();
        return { count: customerCount };

      case "get_inventory_status":
        const cylinders = await prisma.cylinder.groupBy({
          by: ["status"],
          _count: { status: true },
        });
        const statusMap = cylinders.reduce((acc: any, item: any) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {});
        return {
          inStock: statusMap.IN_STOCK || 0,
          assigned: statusMap.ASSIGNED || 0,
          maintenance: statusMap.MAINTENANCE || 0,
          retired: statusMap.RETIRED || 0,
        };

      case "get_todays_sales":
        const todaySales = await prisma.cylinderEntry.aggregate({
          where: {
            deliveryDate: {
              gte: today,
            },
          },
          _sum: {
            amount: true,
          },
        });
        const sales = todaySales._sum.amount || 0;
        const todayCount = await prisma.cylinderEntry.count({
          where: {
            deliveryDate: {
              gte: today,
            },
          },
        });
        return { totalAmount: sales, totalDeliveries: todayCount };

      case "get_pending_payments":
        const pendingBills = await prisma.bill.findMany({
          where: {
            status: {
              in: ["NOT_PAID", "PARTIALLY_PAID"],
            },
          },
          include: {
            customer: true,
          },
          orderBy: {
            currentMonthBill: "desc",
          },
          take: 10,
        });
        const totalPending = pendingBills.reduce((sum, bill) => sum + bill.currentMonthBill, 0);
        return {
          bills: pendingBills.map((bill) => ({
            customerName: bill.customer.name,
            amount: bill.currentMonthBill,
            status: bill.status,
          })),
          totalAmount: totalPending,
          count: pendingBills.length,
        };

      case "get_low_stock":
        const stockByType = await prisma.cylinder.groupBy({
          by: ["gasType"],
          where: {
            status: "IN_STOCK",
          },
          _count: {
            gasType: true,
          },
        });
        const lowStockItems = stockByType
          .filter((item: any) => item._count.gasType < 10)
          .map((item: any) => ({
            type: item.gasType,
            count: item._count.gasType,
          }));
        return { items: lowStockItems };

      case "get_todays_deliveries":
        const todayDeliveries = await prisma.cylinderEntry.findMany({
          where: {
            deliveryDate: {
              gte: today,
            },
          },
          orderBy: {
            deliveryDate: "desc",
          },
          take: 10,
        });
        return {
          deliveries: todayDeliveries.map((delivery) => ({
            customerName: delivery.customerName,
            quantity: delivery.quantity,
            cylinderType: delivery.cylinderType,
            amount: delivery.amount,
          })),
        };

      case "get_customer_details":
        if (params?.customerCode || params?.customerName) {
          const customer = await prisma.customer.findFirst({
            where: params.customerCode
              ? { customerCode: parseInt(params.customerCode) }
              : { name: { contains: params.customerName, mode: "insensitive" } },
            include: {
              bills: {
                where: {
                  status: { in: ["NOT_PAID", "PARTIALLY_PAID"] },
                },
              },
            },
          });
          if (!customer) {
            return { error: "Customer not found" };
          }
          const pendingAmount = customer.bills.reduce((sum, bill) => sum + bill.currentMonthBill, 0);
          return {
            name: customer.name,
            code: customer.customerCode,
            phone: customer.contactNumber,
            email: customer.email,
            type: customer.customerType,
            status: customer.status,
            pendingAmount: pendingAmount,
          };
        }
        return { error: "Please specify customer code or name" };

      default:
        return null;
    }
  } catch (error: any) {
    console.error("Database query error:", error);
    throw error;
  }
}

async function formatResponseWithGemini(userMessage: string, intent: string, data: any): Promise<string> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-pro" });

    let prompt = `You are a helpful assistant for LPG Nexus, a gas cylinder management system. The user asked: "${userMessage}"\n\n`;

    if (data && !data.error) {
      prompt += `Here is the data from the database:\n${JSON.stringify(data, null, 2)}\n\n`;
      prompt += `Please provide a natural, friendly, and human-like response based on this data. Format it nicely with bullet points or clear structure. Be conversational and helpful.`;
    } else if (data?.error) {
      prompt += `There was an issue: ${data.error}\n\nPlease provide a friendly, helpful response explaining this to the user.`;
    } else {
      prompt += `Please provide a helpful, friendly response. You can tell them what information is available in the system and how they can ask for it.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini formatting error:", error);
    // Fallback to basic formatting if Gemini fails
    return formatFallbackResponse(intent, data);
  }
}

function formatFallbackResponse(intent: string, data: any): string {
  if (data?.error) {
    return data.error;
  }

  switch (intent) {
    case "get_customers_count":
      return `We have **${data.count}** total customers in the system.`;

    case "get_inventory_status":
      return `**Current Inventory Status:**\n\n• **In Stock:** ${data.inStock} cylinders\n• **Assigned:** ${data.assigned} cylinders\n• **Maintenance:** ${data.maintenance} cylinders\n• **Retired:** ${data.retired} cylinders`;

    case "get_todays_sales":
      return `**Today's Sales Summary:**\n\n• Total Amount: **Rs ${data.totalAmount.toLocaleString()}**\n• Total Deliveries: **${data.totalDeliveries}** orders`;

    case "get_pending_payments":
      if (data.count === 0) {
        return "✅ No pending payments found. All bills are cleared!";
      }
      let response = `**Pending Payments:** (${data.count} bills, Total: Rs ${data.totalAmount.toLocaleString()})\n\n`;
      data.bills.forEach((bill: any, index: number) => {
        response += `${index + 1}. **${bill.customerName}** - Rs ${bill.amount.toLocaleString()} (${bill.status.replace("_", " ")})\n`;
      });
      return response;

    case "get_low_stock":
      if (data.items.length === 0) {
        return "✅ All items are well stocked!";
      }
      let stockResponse = "⚠️ **Low Stock Alerts:**\n\n";
      data.items.forEach((item: any) => {
        stockResponse += `• **${item.type}:** ${item.count} units (below 10)\n`;
      });
      return stockResponse;

    case "get_todays_deliveries":
      if (data.deliveries.length === 0) {
        return "No deliveries scheduled for today.";
      }
      let deliveryResponse = `**Today's Deliveries:** (${data.deliveries.length} scheduled)\n\n`;
      data.deliveries.forEach((delivery: any, index: number) => {
        deliveryResponse += `${index + 1}. **${delivery.customerName}**\n   ${delivery.quantity}x ${delivery.cylinderType} - Rs ${delivery.amount.toLocaleString()}\n`;
      });
      return deliveryResponse;

    case "get_customer_details":
      return `**Customer Details:**\n\n• **Name:** ${data.name}\n• **Code:** ${data.code}\n• **Phone:** ${data.phone}\n• **Email:** ${data.email || "N/A"}\n• **Type:** ${data.type}\n• **Status:** ${data.status}\n• **Pending Amount:** Rs ${data.pendingAmount.toLocaleString()}`;

    case "general":
    default:
      return `I can help you with:\n\n• Total customers count\n• Inventory status\n• Today's sales\n• Pending payments\n• Low stock alerts\n• Today's deliveries\n• Customer details\n\nTry asking: "Show today's sales" or "How many customers?"`;
  }
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return createErrorResponse("Message is required", 400);
    }

    // Detect intent from message
    const { intent, params } = detectIntent(message);

    // Get data from database
    let data: any = null;
    try {
      data = await getDatabaseData(intent, params);
    } catch (error: any) {
      console.error("Database error:", error);
      data = { error: `Database error: ${error.message}` };
    }

    // Format response with Gemini for human-like answers
    const response = await formatResponseWithGemini(message, intent, data);

    // Log the interaction
    try {
      await prisma.activityLog.create({
        data: {
          action: "Chatbot Query",
          module: "Assistant",
          details: `User query: ${message.substring(0, 100)} - Intent: ${intent}`,
        },
      });
    } catch {
      // Don't fail if logging fails
    }

    return successResponse({
      response: response,
      intent: intent,
    });
  } catch (error: any) {
    console.error("Chatbot error:", error);
    return createErrorResponse(
      error?.message || "I encountered an error processing your request. Please try again.",
      500
    );
  }
}
