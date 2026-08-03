'use client'
import { useState } from 'react'

type Props = {
  products: any[]
  newProduct: string
  setNewProduct: (v: string) => void
  newProductPrice: string
  setNewProductPrice: (v: string) => void
  onAdd: () => void
  onDelete: (id: number) => void
}

export default function AdminProductManager({ products, newProduct, setNewProduct, newProductPrice, setNewProductPrice, onAdd, onDelete }: Props) {
  const [showProductManager, setShowProductManager] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold dark:text-white">📦 상품 사전 등록</h2>
        <button onClick={() => setShowProductManager(!showProductManager)} className="text-xs border dark:border-gray-600 dark:text-gray-300 rounded px-2 py-1">{showProductManager ? '닫기' : '관리'}</button>
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
            <div className="space-y-1">
              {products.map((p) => (
                <div key={p.id} className="flex justify-between items-center border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700">
                  <p className="text-sm dark:text-white">{p.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-blue-600">{p.price?.toLocaleString()}P</p>
                    <button onClick={() => onDelete(p.id)} className="text-xs text-red-500">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
