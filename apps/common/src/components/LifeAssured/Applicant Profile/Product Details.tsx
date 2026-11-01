import { FieldCard, type FieldData } from "./Fields";

export function ProductDetails({ fields }: Readonly<{ fields: FieldData[] }>) {
  return <FieldCard title="Product Details" fields={fields} columns={4} />;
}
