'use client'
import { Package } from 'lucide-react'
import { useState } from 'react'

type Props = {
  products: any[]
  newProduct: string
  setNewProduct: (v: string) => void
  newProductPrice: string
  setNewProductPrice: (v: string) => void
  onAdd: () => void
  onDelete: (id: number) => void
  onUpdatePrice: (id: number, price: number) => void
}

export default function AdminProductManager({ products, newProduct, setNewProduct, newProductPrice, setNewProductPrice, onAdd, onDelete, onUpdatePrice }: Props) {
  const [showProductManager, setShowProductManager] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const sortedProducts = [...products].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold dark:text-white flex items-center gap-1"><Package size={16} /> 상품 사전 등록</h2>
        <button onClick={() => setShowProductManager(!showProductManager)} className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg px-3 py-1.5">{showProductManager ? '닫기' : '관리'}</button>
      </div>
      {showProductManager && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="상품명" />
            <input type="number" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} className="w-28 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="가격" />
            <button onClick={onAdd} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">추가</button>
          </div>
          {products.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">등록된 상품이 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedProducts.map((p) => (
                <div key={p.id} className="flex justify-between items-center px-3 py-2">
                  <p className="text-sm dark:text-white">{p.name}</p>
                  {editingId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-24 border dark:border-gray-600 rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:text-white" autoFocus />
                      <button onClick={() => { onUpdatePrice(p.id, Number(editPrice) || 0); setEditingId(null) }} className="text-xs text-blue-600">저장</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">취소</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-blue-600">{p.price?.toLocaleString()}원</p>
                      <button onClick={() => { setEditingId(p.id); setEditPrice(String(p.price ?? 0)) }} className="text-xs text-gray-500 dark:text-gray-400">수정</button>
                      <button onClick={() => onDelete(p.id)} className="text-xs text-red-500">삭제</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
