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
import { MoreHorizontal, Edit, Trash, ShoppingBag, ChevronUp } from "lucide-react"
import { type Bill, deleteBill } from "@/lib/actions"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Add this function at the top of your component to handle the rupee symbol
const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`
}

// Add this function to handle currency in PDFs
const formatPdfCurrency = (amount: number) => {
  // For PDF, we'll use "Rs." which is supported by default fonts
  return `Rs. ${amount.toFixed(2)}`
}

interface BillTableProps {
  bills: Bill[]
}

export function BillTable({ bills }: BillTableProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [billToDelete, setBillToDelete] = useState<number | null>(null)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  
  // Calculate total for the selected customer
  const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0)

  const handleEdit = (id: number) => {
    router.push(`/edit-bill/${id}`)
  }

  const handleDelete = async () => {
    if (billToDelete) {
      await deleteBill(billToDelete)
      setIsDeleteDialogOpen(false)
      setBillToDelete(null)
      if (selectedBill?.id === billToDelete) {
        setSelectedBill(null)
      }
    }
  }

  const confirmDelete = (id: number) => {
    setBillToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleSelectBill = (bill: Bill) => {
    setSelectedBill(selectedBill?.id === bill.id ? null : bill)
  }

  // PDF generation function for multiple bills
  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    
    // Add business header
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Anant Communication", doc.internal.pageSize.width / 2, 15, { align: "center" })
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Mandi Ramdas Gali Patiram ke barabar", doc.internal.pageSize.width / 2, 22, { align: "center" })
    doc.text("ph 7906361837 email rajvermaop@gmail.com", doc.internal.pageSize.width / 2, 27, { align: "center" })
    
    // Add horizontal line
    doc.setLineWidth(0.5)
    doc.line(14, 30, doc.internal.pageSize.width - 14, 30)
    
    doc.setFontSize(14)
    doc.text("Bills Statement", 14, 38)
    
    // Group bills by customer - WITH TYPE ANNOTATION
    const billsByCustomer = bills.reduce<Record<string, Bill[]>>((groups, bill) => {
      if (!groups[bill.customer_name]) {
        groups[bill.customer_name] = [];
      }
      groups[bill.customer_name].push(bill);
      return groups;
    }, {});

    let yPos = 44;
    
    // Create tables for each customer
    Object.entries(billsByCustomer).forEach(([customer, customerBills]) => {
      // Add customer name
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`Customer: ${customer}`, 14, yPos)
      yPos += 8;
      
      // Add table with customer bills
      autoTable(doc, {
        startY: yPos,
        head: [[
          "Product Name",
          "Quantity",
          "Wages",
          "Total"
        ]],
        body: customerBills.map(bill => [
          bill.product_name,
          bill.quantity,
          formatPdfCurrency(bill.price_per_unit),
          formatPdfCurrency(bill.total)
        ]),
        foot: [["", "", "Customer Total:", 
          formatPdfCurrency(customerBills.reduce((sum, bill) => sum + bill.total, 0))]],
        footStyles: { 
          fontStyle: 'bold', 
          fillColor: [220, 220, 220], // Darker background for better visibility
          textColor: [0, 0, 0] // Black text to ensure visibility
        },
        styles: { 
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        theme: 'grid' // This enables borders for all cells
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Check if we need a new page
      if (yPos > (doc.internal.pageSize.height - 40) && 
          Object.entries(billsByCustomer).indexOf([customer, customerBills]) < 
          Object.entries(billsByCustomer).length - 1) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Add grand total at the end
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Grand Total: ${formatPdfCurrency(totalAmount)}`, doc.internal.pageSize.width - 30, yPos, { align: "right" })
    
    // Add footer with TypeScript fix for getNumberOfPages
    const pageCount = (doc.internal as any).getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: "right" });
    }
    
    doc.save("bills.pdf")
    
    // Return the doc for the print function to use
    return doc;
  }

  // Fixed print function
  const handlePrintPDF = () => {
    const doc = handleDownloadPDF(); // Now properly returns the doc
    window.open(doc.output("bloburl"), "_blank");
  }

  // Function to generate PDF for a single bill
  const generateSingleBillPdf = (bill: Bill) => {
    const doc = new jsPDF()
    
    // Add business header
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Anant Communication", doc.internal.pageSize.width / 2, 15, { align: "center" })
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Mandi Ramdas Gali Patiram ke barabar", doc.internal.pageSize.width / 2, 22, { align: "center" })
    doc.text("ph 7906361837 email rajvermaop@gmail.com", doc.internal.pageSize.width / 2, 27, { align: "center" })
    
    // Add horizontal line
    doc.setLineWidth(0.5)
    doc.line(14, 30, doc.internal.pageSize.width - 14, 30)
    
    // Add title
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Bill Receipt", 14, 38)
    
    // Add customer info panel
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 42, doc.internal.pageSize.width - 28, 25, "F");
    
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Customer Details:", 16, 48)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Name: ${bill.customer_name}`, 20, 56)
    doc.text(`Bill #: ${bill.id}`, 20, 62)
    
    doc.text(`Date: ${new Date(bill.created_at).toLocaleDateString()}`, doc.internal.pageSize.width - 60, 56)
    
    // Add product details
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Product Details:", 14, 75)
    
    autoTable(doc, {
      startY: 80,
      head: [["Product", "Quantity", "Wages", "Total"]],
      body: [[
        bill.product_name,
        bill.quantity,
        formatPdfCurrency(bill.price_per_unit),
        formatPdfCurrency(bill.total)
      ]],
      styles: { 
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      theme: 'grid' // This enables borders for all cells
    })
    
    // Add payment summary
    const finalY = (doc as any).lastAutoTable.finalY || 95
    
    doc.setFillColor(245, 245, 245);
    doc.rect(doc.internal.pageSize.width - 70, finalY + 10, 56, 30, "F");
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Payment Summary", doc.internal.pageSize.width - 66, finalY + 18)
    
    doc.setFont("helvetica", "normal")
    doc.text(`Total Amount:`, doc.internal.pageSize.width - 66, finalY + 25)
    doc.text(`Amount Paid:`, doc.internal.pageSize.width - 66, finalY + 32)
    doc.text(`Remaining:`, doc.internal.pageSize.width - 66, finalY + 39)
    
    doc.setFont("helvetica", "bold")
    doc.text(formatPdfCurrency(bill.total), doc.internal.pageSize.width - 20, finalY + 25, { align: "right" })
    doc.text(formatPdfCurrency(bill.paid_amount), doc.internal.pageSize.width - 20, finalY + 32, { align: "right" })
    doc.text(formatPdfCurrency(bill.remaining_amount), doc.internal.pageSize.width - 20, finalY + 39, { align: "right" })
    
    // Add signature area
    doc.line(20, finalY + 60, 80, finalY + 60)
    doc.text("Authorized Signature", 28, finalY + 66)
    
    // Add footer
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.text("Thank you for your business!", doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 15, { align: "center" })
    
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <Button 
            type="button" 
            onClick={handleDownloadPDF} 
            variant="secondary"
            className="rounded-lg flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </Button>
          <Button 
            type="button" 
            onClick={handlePrintPDF} 
            variant="outline"
            className="rounded-lg flex items-center gap-2 border-gray-200 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1-2-2h16a2 2 0 0 1-2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print PDF
          </Button>
        </div>
        
        {/* Display total count */}
        <div className="text-sm text-gray-500">
          {bills.length} product{bills.length !== 1 ? 's' : ''} found
        </div>
      </div>
      
      <div className="rounded-md overflow-hidden border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">Product Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
              <TableHead className="font-semibold text-gray-700">Wages</TableHead>
              <TableHead className="font-semibold text-gray-700">Total</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center text-gray-500">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mb-2" />
                    <p>No products found. Add your first product to get started.</p>
                    <Button 
                      variant="link" 
                      className="mt-2 text-primary"
                      onClick={() => router.push("/add-bill")}
                    >
                      Add a product
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Row styling for alternate rows
              bills.map((bill, index) => (
                <TableRow 
                  key={bill.id} 
                  className={`
                    ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    ${selectedBill?.id === bill.id ? "bg-blue-50 outline outline-2 outline-blue-200" : ""}
                    hover:bg-blue-50/50 cursor-pointer transition-colors
                  `}
                  onClick={() => handleSelectBill(bill)}
                >
                  <TableCell className="font-medium">{bill.product_name}</TableCell>
                  <TableCell>{bill.quantity}</TableCell>
                  <TableCell className="text-gray-600">{formatCurrency(bill.price_per_unit)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(bill.total)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1-2-2h16a2 2 0 0 1-2 2v5a2 2 0 0 1-2 2h-2" />
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
          {/* Add footer with total */}
          {bills.length > 0 && (
            <tfoot>
              <tr className="border-t">
                <td colSpan={3} className="py-3 px-4 text-right font-semibold">Grand Total:</td>
                <td className="py-3 px-4 font-bold text-primary">{formatCurrency(totalAmount)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </Table>
      </div>
      
      {/* Display selected bill details */}
      {selectedBill && (
        <div className="mt-6 p-5 border rounded-lg bg-blue-50 animate-fadeIn">
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold text-blue-900">Selected Bill Details</h3>
            <button 
              onClick={() => setSelectedBill(null)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Close <ChevronUp size={14} className="inline" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-medium">{selectedBill.customer_name}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-xs text-gray-500">Paid Amount</p>
              <p className="font-medium text-green-600">{formatCurrency(selectedBill.paid_amount)}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="font-medium text-amber-600">{formatCurrency(selectedBill.remaining_amount)}</p>
            </div>
            
            <div className="bg-white p-3 rounded-md shadow-sm sm:col-span-3">
              <p className="text-xs text-gray-500">Created On</p>
              <p className="font-medium">{new Date(selectedBill.created_at).toLocaleDateString()} 
                <span className="text-gray-500 text-xs ml-2">
                  {new Date(selectedBill.created_at).toLocaleTimeString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

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
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  )
}