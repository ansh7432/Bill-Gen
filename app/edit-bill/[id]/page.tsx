import { notFound } from "next/navigation"
import { BillForm } from "@/components/bill-form"
import { getBillById, updateBill } from "@/lib/actions"

interface EditBillPageProps {
  params: {
    id: string
  }
}

export default async function EditBillPage({ params }: EditBillPageProps) {
  const resolvedParams = await params
  const id = Number.parseInt(resolvedParams.id)
  const bill = await getBillById(id)

  if (!bill) {
    notFound()
  }

  const updateBillWithId = async (formData: FormData) => {
    "use server"
    return updateBill(id, formData)
  }

  return (
    <div className="container mx-auto py-10">
      <BillForm bill={bill} action={updateBillWithId} isEdit />
    </div>
  )
}