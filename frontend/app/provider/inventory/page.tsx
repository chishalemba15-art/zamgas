'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { inventoryAPI, type InventoryItem } from '@/lib/api'
import { Package, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const CYLINDER_TYPES = [
  { value: '3KG', label: '3 KG' },
  { value: '5KG', label: '5 KG' },
  { value: '6KG', label: '6 KG' },
  { value: '9KG', label: '9 KG' },
  { value: '12KG', label: '12 KG' },
  { value: '13KG', label: '13 KG' },
  { value: '19KG', label: '19 KG' },
  { value: '48KG', label: '48 KG' },
]

export default function ProviderInventory() {
  // Start with null to distinguish "not loaded" vs "loaded and empty"
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    cylinder_type: '13KG',
    refill_price: '',
    buy_price: '',
    stock_quantity: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const data = await inventoryAPI.getProviderInventory()
      // Always ensure it's an array
      setInventory(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to load inventory')
      setInventory([]) // Safe fallback
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!formData.refill_price || !formData.buy_price || !formData.stock_quantity) {
      toast.error('Please fill all fields')
      return
    }

    setIsSaving(true)
    try {
      await inventoryAPI.addItem({
        cylinder_type: formData.cylinder_type,
        refill_price: parseFloat(formData.refill_price),
        buy_price: parseFloat(formData.buy_price),
        stock_quantity: parseInt(formData.stock_quantity),
      })

      toast.success('Item added successfully')
      setShowAddForm(false)
      setFormData({
        cylinder_type: '13KG',
        refill_price: '',
        buy_price: '',
        stock_quantity: '',
      })
      fetchInventory()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateStock = async (cylinderType: string, newQuantity: number) => {
    try {
      await inventoryAPI.updateStock(cylinderType, newQuantity)
      toast.success('Stock updated')
      fetchInventory()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update stock')
    }
  }

  // Safe check: treat null or undefined as loading/empty
  const hasInventory = inventory && inventory.length > 0

  return (
    <DashboardLayout title="Inventory Management">
      <div className="space-y-6">
        {/* Add Item Button */}
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-neutral-900">Add Inventory Item</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Cylinder Type"
                  options={CYLINDER_TYPES}
                  value={formData.cylinder_type}
                  onChange={(e) => setFormData({ ...formData, cylinder_type: e.target.value })}
                />

                <Input
                  label="Stock Quantity"
                  type="number"
                  placeholder="100"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                />

                <Input
                  label="Refill Price (ZMW)"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={formData.refill_price}
                  onChange={(e) => setFormData({ ...formData, refill_price: e.target.value })}
                />

                <Input
                  label="Buy Price (ZMW)"
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={formData.buy_price}
                  onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="primary" onClick={handleAddItem} isLoading={isSaving}>
                  Save Item
                </Button>
                <Button variant="secondary" onClick={() => setShowAddForm(false)} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Inventory List */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-neutral-900">Current Inventory</h2>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="text-center py-12 text-neutral-500">Loading inventory...</div>
            ) : !hasInventory ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">No inventory items yet</p>
                <p className="text-sm text-neutral-500 mt-1">Add your first item to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory!.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{item.cylinder_type}</h3>
                        <p className="text-sm text-neutral-600">
                          Stock: {item.stock_quantity} units
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.stock_quantity > 10
                            ? 'bg-success-100 text-success-700'
                            : item.stock_quantity > 0
                            ? 'bg-accent-100 text-accent-700'
                            : 'bg-danger-100 text-danger-700'
                        }`}
                      >
                        {item.stock_quantity > 10
                          ? 'In Stock'
                          : item.stock_quantity > 0
                          ? 'Low Stock'
                          : 'Out of Stock'}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Refill Price:</span>
                        <span className="font-medium">{formatCurrency(item.refill_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Buy Price:</span>
                        <span className="font-medium">{formatCurrency(item.buy_price)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="input text-sm flex-1"
                        placeholder="Add stock"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement
                            const value = parseInt(input.value)
                            if (!isNaN(value) && value > 0) {
                              handleUpdateStock(item.cylinder_type, item.stock_quantity + value)
                              input.value = ''
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}