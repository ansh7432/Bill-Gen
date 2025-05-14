"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import { type Bill, deleteBill } from "@/lib/actions"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface BillTableProps {
  bills: Bill[]
}

export function BillTable({ bills }: BillTableProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [billToDelete, setBillToDelete] = useState<number | null>(null)

  const handleEdit = (id: number) => {
    router.push(`/edit-bill/${id}`)
  }

  const handleDelete = async () => {
    if (billToDelete) {
      await deleteBill(billToDelete)
      setIsDeleteDialogOpen(false)
      setBillToDelete(null)
    }
  }

  const confirmDelete = (id: number) => {
    setBillToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  // PDF generation function
  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    doc.text("Bills", 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [[
        "Customer Name",
        "Product Name",
        "Quantity",
        "Price per Unit",
        "Total",
        "Paid",
        "Remaining"
      ]],
      body: bills.map(bill => [
        bill.customer_name,
        bill.product_name,
        bill.quantity,
        `$${bill.price_per_unit.toFixed(2)}`,
        `$${bill.total.toFixed(2)}`,
        `$${bill.paid_amount.toFixed(2)}`,
        `$${bill.remaining_amount.toFixed(2)}`
      ]),
    })
    doc.save("bills.pdf")
  }

  const handlePrintPDF = () => {
    const doc = new jsPDF()
    doc.text("Bills", 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [[
        "Customer Name",
        "Product Name",
        "Quantity",
        "Price per Unit",
        "Total",
        "Paid",
        "Remaining"
      ]],
      body: bills.map(bill => [
        bill.customer_name,
        bill.product_name,
        bill.quantity,
        `$${bill.price_per_unit.toFixed(2)}`,
        `$${bill.total.toFixed(2)}`,
        `$${bill.paid_amount.toFixed(2)}`,
        `$${bill.remaining_amount.toFixed(2)}`
      ]),
    })
    // Open PDF in new window for printing
    window.open(doc.output("bloburl"), "_blank")
  }

  // Function to generate PDF for a single bill
  const generateSingleBillPdf = (bill: Bill) => {
    const doc = new jsPDF()
    
    // Add title with bill and customer info
    doc.setFontSize(20)
    doc.text("Bill Receipt", 14, 22)
    
    // Add customer info
    doc.setFontSize(12)
    doc.text(`Customer: ${bill.customer_name}`, 14, 32)
    doc.text(`Date: ${new Date(bill.created_at).toLocaleDateString()}`, 14, 38)
    doc.text(`Bill #: ${bill.id}`, 14, 44)
    
    // Add product details
    autoTable(doc, {
      startY: 50,
      head: [["Product", "Quantity", "Price per Unit", "Total"]],
      body: [[
        bill.product_name,
        bill.quantity,
        `$${bill.price_per_unit.toFixed(2)}`,
        `$${bill.total.toFixed(2)}`
      ]],
    })
    
    // Add payment summary
    const finalY = (doc as any).lastAutoTable.finalY || 65
    doc.text(`Total Amount: $${bill.total.toFixed(2)}`, 14, finalY + 10)
    doc.text(`Amount Paid: $${bill.paid_amount.toFixed(2)}`, 14, finalY + 16)
    doc.text(`Remaining: $${bill.remaining_amount.toFixed(2)}`, 14, finalY + 22)
    
    return doc
  }

  // Download single bill PDF
  const handleDownloadSingleBill = (bill: Bill) => {
    const doc = generateSingleBillPdf(bill)
    doc.save(`bill-${bill.id}-${bill.customer_name}.pdf`)
  }

  // Print single bill PDF
  const handlePrintSingleBill = (bill: Bill) => {
    const doc = generateSingleBillPdf(bill)
    window.open(doc.output("bloburl"), "_blank")
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Button type="button" onClick={handleDownloadPDF} variant="secondary">
          Download PDF
        </Button>
        <Button type="button" onClick={handlePrintPDF} variant="outline">
          Print PDF
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price per Unit</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                No products found. Add your first product to get started.
              </TableCell>
            </TableRow>
          ) : (
            bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>{bill.customer_name}</TableCell>
                <TableCell className="font-medium">{bill.product_name}</TableCell>
                <TableCell>{bill.quantity}</TableCell>
                <TableCell>${bill.price_per_unit.toFixed(2)}</TableCell>
                <TableCell>${bill.total.toFixed(2)}</TableCell>
                <TableCell>${bill.paid_amount.toFixed(2)}</TableCell>
                <TableCell>${bill.remaining_amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(bill.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadSingleBill(bill)}>
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrintSingleBill(bill)}>
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Print
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => confirmDelete(bill.id)} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
