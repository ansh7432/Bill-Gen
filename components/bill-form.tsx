"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X } from "lucide-react"
import type { Bill } from "@/lib/actions"

type Item = {
  product_name: string
  quantity: number
  price_per_unit: number
}

interface BillFormProps {
  action: (formData: FormData) => Promise<any>
  bill?: Bill
  isEdit?: boolean
}

export function BillForm({ action, bill, isEdit }: BillFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [currentItem, setCurrentItem] = useState<Item>({ 
    product_name: "", quantity: 1, price_per_unit: 0 
  })
  const [addedItems, setAddedItems] = useState<Item[]>([])
  const [paidAmount, setPaidAmount] = useState(0)

  // Prefill form fields when editing
  useEffect(() => {
    if (bill) {
      setCustomerName(bill.customer_name)
      
      if (bill.items && bill.items.length > 0) {
        // In edit mode, load first item as current and rest as added
        const [first, ...rest] = bill.items
        setCurrentItem({
          product_name: first.product_name,
          quantity: first.quantity,
          price_per_unit: first.price_per_unit
        })
        setAddedItems(rest.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          price_per_unit: item.price_per_unit
        })))
      } else {
        // Fallback to single item
        setCurrentItem({
          product_name: bill.product_name,
          quantity: bill.quantity,
          price_per_unit: bill.price_per_unit,
        })
      }
      setPaidAmount(bill.paid_amount)
    }
  }, [bill])

  const handleChange = (field: keyof Item, value: string | number) => {
    setCurrentItem(item => ({
      ...item,
      [field]: field === "product_name" ? value : Number(value)
    }))
  }

  // Add current item to the list and clear form for next product
  const addItem = () => {
    if (currentItem.product_name.trim() === "") {
      alert("Please enter a product name")
      return
    }
    
    setAddedItems([...addedItems, { ...currentItem }])
    setCurrentItem({ product_name: "", quantity: 1, price_per_unit: 0 })
  }

  const removeItem = (idx: number) => {
    setAddedItems(items => items.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Don't allow submission with empty current item and no added items
    if (currentItem.product_name.trim() === "" && addedItems.length === 0) {
      alert("Please add at least one product")
      return
    }
    
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("customer_name", customerName)
    
    // Include current item if it has a name
    const allItems = currentItem.product_name.trim() !== "" 
      ? [...addedItems, currentItem]
      : [...addedItems]
    
    // Add all items
    allItems.forEach((item, idx) => {
      formData.append(`items[${idx}][product_name]`, item.product_name)
      formData.append(`items[${idx}][quantity]`, String(item.quantity))
      formData.append(`items[${idx}][price_per_unit]`, String(item.price_per_unit))
    })
    
    // Add paidAmount as a separate field
    formData.append("paidAmount", String(paidAmount))
    
    await action(formData)
    setIsSubmitting(false)
  }

  // Calculate totals including current item (if valid)
  const allItems = currentItem.product_name.trim() !== "" 
    ? [...addedItems, currentItem]
    : [...addedItems]
  
  const totalSum = allItems.reduce((sum, item) => sum + item.quantity * item.price_per_unit, 0)

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 border-b">
        <CardTitle className="text-xl">{isEdit ? "Edit Bill" : "Add Products"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 p-6">
          {/* Customer section */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h3>
            <div className="space-y-2">
              <Label className="text-gray-700">Customer Name *</Label>
              <Input
                name="customer_name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="border-gray-300 focus:border-primary focus:ring-primary"
                placeholder="Enter customer name"
                required
              />
            </div>
          </div>
          
          {/* Products section */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Products</h3>
            
            {/* Added products table with styled header */}
            {addedItems.length > 0 && (
              <div className="rounded-md overflow-hidden border mb-6">
                <div className="bg-blue-50 py-2 px-4 border-b">
                  <h4 className="font-medium text-blue-800">Added Products</h4>
                </div>
                <div className="p-2">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs">Quantity</TableHead>
                        <TableHead className="text-xs">Wages</TableHead>
                        <TableHead className="text-xs">Total</TableHead>
                        <TableHead className="text-xs w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addedItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.price_per_unit.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">${(item.quantity * item.price_per_unit).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeItem(idx)}
                              className="h-7 w-7 p-0 rounded-full hover:bg-red-50 hover:text-red-600"
                            >
                              <X size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            
            {/* New product form */}
            <div className="bg-blue-50/50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">Add New Product</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700">Product Name *</Label>
                  <Input
                    value={currentItem.product_name}
                    onChange={e => handleChange("product_name", e.target.value)}
                    placeholder="Enter product name"
                    className="border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={e => handleChange("quantity", e.target.value)}
                      placeholder="1"
                      className="border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Wages</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.price_per_unit}
                      onChange={e => handleChange("price_per_unit", e.target.value)}
                      placeholder="0.00"
                      className="border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={addItem} 
                    variant="outline"
                    disabled={!currentItem.product_name.trim()}
                    className="flex gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add This Product
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment section */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Payment Details</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Paid Amount (for all products)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="pl-8 border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700">Total Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input 
                    value={totalSum.toFixed(2)} 
                    readOnly 
                    className="pl-8 bg-gray-50 font-medium text-gray-700"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700">Remaining Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input 
                    value={(totalSum - paidAmount).toFixed(2)} 
                    readOnly 
                    className={`pl-8 font-medium ${
                      totalSum - paidAmount > 0 
                        ? "text-amber-700 bg-amber-50" 
                        : "text-green-700 bg-green-50"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between py-4 px-6 bg-gray-50 border-t">
          <Button type="button" variant="outline" onClick={() => router.push("/")} className="border-gray-300">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : isEdit ? "Update Bill" : "Save All Products"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}