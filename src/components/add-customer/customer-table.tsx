import { CustomerFormValues } from "@/components/add-customer/customer-form-drawer";
import { CustomerTableWrapper } from "./customer-table-wrapper";
import type { CustomerRow } from "./customer-table-client";

interface CustomerTableProps {
  customers: CustomerRow[];
  query: string;
  page: number;
  totalPages: number;
  pageSize: number | string;
  onCreateCustomer: (values: CustomerFormValues) => Promise<void>;
  nextCustomerCode: number;
  basePath?: string;
}

export type { CustomerRow } from "./customer-table-client";

export function CustomerTable({
  customers,
  query,
  page,
  totalPages,
  pageSize,
  onCreateCustomer,
  nextCustomerCode,
  basePath = "/add-customer",
}: CustomerTableProps) {
  return (
    <CustomerTableWrapper
      customers={customers}
      query={query}
      page={page}
      totalPages={totalPages}
      pageSize={pageSize}
      onCreateCustomer={onCreateCustomer}
      nextCustomerCode={nextCustomerCode}
      basePath={basePath}
    />
  );
}
