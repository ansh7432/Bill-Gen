import { BillForm } from "@/components/bill-form"
import { createBill } from "@/lib/actions"

export default function AddBillPage() {
  return (
    <div className="container mx-auto py-10">
      <BillForm action={createBill} />
    </div>
  )
}
