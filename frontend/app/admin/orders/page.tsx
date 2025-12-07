'use client'

import { useEffect, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import { DataTable } from '@/components/admin/DataTable'
import { Truck } from 'lucide-react'
import { adminAPI } from '@/lib/api'
import type { Order, User } from '@/lib/api'
import toast from 'react-hot-toast'

interface Courier extends User {
  user_type: 'courier'
  status?: 'active' | 'inactive' | 'suspended'
}

export default function OrdersPage() {
  const adminStore = useAdminStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [selectedCourierId, setSelectedCourierId] = useState('')
  const [assigning, setAssigning] = useState(false)
  
  // Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  
  const limit = 10

  const fetchOrders = async (pageNum: number, search?: string, status?: string) => {
    try {
      setLoading(true)
      const response = await adminAPI.getAllOrders(pageNum, limit, search, status)
      setOrders(response.orders)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(page, undefined, statusFilter || undefined)
  }, [page, statusFilter])

  const handleViewOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setViewOrder(order)
      setShowDetailsModal(true)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return

    try {
      await adminAPI.cancelOrder(orderId, reason)
      toast.success('Order cancelled successfully')
      fetchOrders(page, undefined, statusFilter || undefined)
    } catch (error) {
      console.error('Failed to cancel order:', error)
      toast.error('Failed to cancel order')
    }
  }

  const openAssignModal = async (order: Order) => {
    setSelectedOrder(order)
    setShowAssignModal(true)
    // Fetch active couriers
    try {
      const response = await adminAPI.getAllCouriers(1, 100, undefined, 'active')
      setCouriers(response.couriers)
    } catch (error) {
      console.error('Failed to fetch couriers:', error)
      toast.error('Failed to load available couriers')
    }
  }

  const handleAssignCourier = async () => {
    if (!selectedOrder || !selectedCourierId) return

    try {
      setAssigning(true)
      await adminAPI.assignCourier(selectedOrder.id, selectedCourierId)
      toast.success('Courier assigned successfully')
      setShowAssignModal(false)
      setSelectedOrder(null)
      setSelectedCourierId('')
      fetchOrders(page, undefined, statusFilter || undefined)
    } catch (error) {
      console.error('Failed to assign courier:', error)
      toast.error('Failed to assign courier')
    } finally {
      setAssigning(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'in-transit':
        return 'bg-blue-100 text-blue-700'
      case 'accepted':
        return 'bg-cyan-100 text-cyan-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-700'
      case 'pending':
        return 'text-amber-700'
      case 'failed':
        return 'text-red-700'
      case 'refunded':
        return 'text-blue-700'
      default:
        return 'text-gray-700'
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">View and manage all orders</p>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Delivered</p>
          <p className="text-3xl font-bold text-green-600 mt-2">127</p>
          <p className="text-sm text-gray-600 mt-2">49.4% completion</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">In Transit</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">28</p>
          <p className="text-sm text-gray-600 mt-2">10.9% in progress</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">32</p>
          <p className="text-sm text-gray-600 mt-2">12.5% awaiting</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Rejected</p>
          <p className="text-3xl font-bold text-red-600 mt-2">12</p>
          <p className="text-sm text-gray-600 mt-2">4.7% cancelled</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'pending', 'accepted', 'in-transit', 'delivered', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status === 'all' ? '' : status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              (status === 'all' && !statusFilter) || statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <DataTable<Order>
        columns={[
          {
            key: 'id',
            label: 'Order ID',
            width: '10%',
            render: (value) => <span className="font-mono font-semibold text-blue-600 text-xs">{value.slice(0, 8)}</span>,
          },
          {
            key: 'user_name',
            label: 'Customer',
            width: '15%',
            render: (_, row) => (
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{row.user_name}</span>
                <span className="text-xs text-gray-500">{row.user_phone}</span>
              </div>
            ),
          },
          {
            key: 'courier_name',
            label: 'Courier',
            width: '15%',
            render: (_, row) => (
              <div className="flex flex-col">
                {row.courier_name ? (
                   <>
                    <span className="font-medium text-gray-900">{row.courier_name}</span>
                    <span className={`text-xs font-medium ${
                      row.courier_status === 'accepted' ? 'text-green-600' :
                      row.courier_status === 'rejected' ? 'text-red-500' : 
                      'text-amber-500'
                    }`}>
                      {row.courier_status === 'pending' ? '🤖 Auto-Assigned (Pending)' : 
                       row.courier_status === 'accepted' ? '✅ Accepted' :
                       row.courier_status?.toUpperCase()}
                    </span>
                   </>
                ) : (
                  <span className="text-xs text-gray-400 italic">Unassigned</span>
                )}
              </div>
            ),
          },
          {
            key: 'grand_total',
            label: 'Amount',
            width: '10%',
            render: (value) => <span className="font-semibold text-gray-900">ZK {value.toLocaleString()}</span>,
          },
          {
            key: 'status',
            label: 'Status',
            width: '12%',
            render: (value) => (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                {value.replace('-', ' ').toUpperCase()}
              </span>
            ),
          },
          {
            key: 'payment_status',
            label: 'Payment',
            width: '10%',
            render: (value) => (
              <span className={`font-medium text-xs ${getPaymentStatusColor(value)}`}>
                {value.toUpperCase()}
              </span>
            ),
          },
          {
            key: 'created_at',
            label: 'Date',
            width: '12%',
            render: (value) => {
              const date = new Date(value)
              return <span className="text-xs text-gray-500">{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            },
          },
        ]}
        data={orders}
        actions={[
          {
            label: 'View',
            variant: 'primary',
            icon: <Eye size={16} />,
            onClick: (row) => handleViewOrder(row.id),
          },
          {
            label: 'Assign',
            variant: 'primary',
            icon: <Truck size={16} />,
            onClick: (row) => openAssignModal(row),
            disabled: (row) => row.status === 'delivered' || row.status === 'rejected',
          },
          {
            label: 'Cancel',
            variant: 'danger',
            icon: <X size={16} />,
            onClick: (row) => handleCancelOrder(row.id),
            disabled: (row) => row.status === 'delivered' || row.status === 'rejected',
          },
        ]}
        loading={loading}
        onSearch={(query) => {
          setPage(1)
          fetchOrders(1, query, statusFilter || undefined)
        }}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
        }}
      />


      {/* Order Details Modal */}
      {showDetailsModal && viewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold font-outfit text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-500 font-mono">#{viewOrder.id}</p>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Customer Details */}
                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Customer Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium lowercase">Name</label>
                      <p className="font-medium text-gray-900">{viewOrder.user_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium lowercase">Phone</label>
                      <p className="font-medium text-gray-900">{viewOrder.user_phone}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium lowercase">Email</label>
                      <p className="text-gray-900">{viewOrder.user_email}</p>
                    </div>
                  </div>
                </section>

                {/* Delivery Information */}
                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Delivery Details</h4>
                   <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium lowercase">Address</label>
                      <p className="font-medium text-gray-900">{viewOrder.delivery_address || 'No address provided'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 font-medium lowercase">Method</label>
                        <p className="font-medium text-gray-900 capitalize">{viewOrder.delivery_method?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium lowercase">Coordinates</label>
                        <p className="text-sm font-mono text-gray-600">
                          {viewOrder.current_latitude && viewOrder.current_longitude 
                            ? `${viewOrder.current_latitude.toFixed(4)}, ${viewOrder.current_longitude.toFixed(4)}`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                 {/* Order Specifics */}
                 <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Order Items</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                       <span className="font-medium text-gray-900">{viewOrder.cylinder_type} Cylinder</span>
                       <span className="text-gray-600">x {viewOrder.quantity}</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Payment Information */}
                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Payment Details</h4>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div>
                        <label className="text-xs text-blue-500 font-medium lowercase">Status</label>
                        <p className={`font-bold ${getPaymentStatusColor(viewOrder.payment_status)}`}>
                          {viewOrder.payment_status?.toUpperCase() || 'UNKNOWN'}
                        </p>
                       </div>
                       <div>
                        <label className="text-xs text-blue-500 font-medium lowercase">Method</label>
                        <p className="font-medium text-gray-900 capitalize">{viewOrder.payment_method?.replace('_', ' ') || 'N/A'}</p>
                       </div>
                    </div>
                    
                    <div className="space-y-3 border-t border-blue-200 pt-3">
                      <div>
                         <label className="text-xs text-blue-500 font-medium lowercase">PawaPay Transaction ID</label>
                         <p className="font-mono text-sm font-medium text-gray-900 break-all">
                           {viewOrder.payment_ref || 'N/A'}
                         </p>
                      </div>
                       <div>
                         <label className="text-xs text-blue-500 font-medium lowercase">Provider Reference</label>
                         <p className="text-sm font-medium text-gray-900">
                           {viewOrder.payment_provider || 'N/A'}
                         </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Financial Breakdown */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">ZK {((viewOrder.grand_total - viewOrder.delivery_fee - viewOrder.service_charge)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">ZK {viewOrder.delivery_fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Charge</span>
                      <span className="font-medium">ZK {viewOrder.service_charge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span className="text-gray-900">Grand Total</span>
                      <span className="text-blue-600">ZK {viewOrder.grand_total.toLocaleString()}</span>
                    </div>
                  </div>
                </section>

                {/* Assignment & Status */}
                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Status & Assignment</h4>
                   <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                       <span className="text-sm font-medium text-gray-600">Order Status</span>
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(viewOrder.status)}`}>
                         {viewOrder.status?.toUpperCase() || 'UNKNOWN'}
                       </span>
                    </div>

                    <div className="border rounded-lg p-4">
                      <p className="text-xs text-gray-500 font-medium mb-2 uppercase">Courier</p>
                      {viewOrder.courier_name ? (
                        <div className="flex items-center justify-between">
                           <div>
                             <p className="font-bold text-gray-900">{viewOrder.courier_name}</p>
                             <p className="text-xs text-gray-500">
                               Status: <span className={
                                 viewOrder.courier_status === 'accepted' ? 'text-green-600 font-medium' : 
                                 viewOrder.courier_status === 'rejected' ? 'text-red-600 font-medium' : 'text-amber-600 font-medium'
                               }>{viewOrder.courier_status === 'pending' ? 'Auto-Assigned (Pending)' : viewOrder.courier_status?.toUpperCase() || 'UNKNOWN'}</span>
                             </p>
                           </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 italic text-sm">No courier assigned</span>
                          <button 
                            onClick={() => {
                              setShowDetailsModal(false)
                              openAssignModal(viewOrder)
                            }}
                            className="text-blue-600 text-sm font-medium hover:underline"
                          >
                            Assign Now
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border rounded-lg p-4">
                      <p className="text-xs text-gray-500 font-medium mb-2 uppercase">Provider</p>
                      <p className="font-bold text-gray-900">{viewOrder.provider_name || 'System Assigned'}</p>
                    </div>
                   </div>
                </section>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center text-xs text-gray-500">
               <span>Created: {new Date(viewOrder.created_at).toLocaleString()}</span>
               <span>Last Updated: {new Date(viewOrder.updated_at || viewOrder.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Assign Courier Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold font-outfit">Assign Courier</h3>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="mb-4 text-gray-600">
                Select a courier to assign to Order <span className="font-semibold">{selectedOrder.id}</span>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Courier
                </label>
                <select
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">-- Select a courier --</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.name} {courier.status === 'active' ? '(Active)' : '(Inactive)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignCourier}
                  disabled={!selectedCourierId || assigning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign Courier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
