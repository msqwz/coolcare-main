import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function TablePagination({ currentPage, totalPages, onPageChange, totalItems, itemName = 'записей' }) {
    if (totalPages <= 1 && totalItems === 0) return null

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--card-bg, white)',
            borderRadius: '0 0 24px 24px'
        }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Всего {itemName}: <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>{totalItems}</span>
            </div>
            
            {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '6px',
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', padding: '0 8px' }}>
                        {currentPage} <span style={{ color: 'var(--text-muted)' }}>из {totalPages}</span>
                    </div>

                    <button 
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: '6px',
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    )
}

export function SortableHeader({ label, sortKey, currentSort, onSort }) {
    const isSorted = currentSort.key === sortKey
    const isAsc = isSorted && currentSort.direction === 'asc'
    
    return (
        <th 
            onClick={() => onSort(sortKey)} 
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title={`Сортировать по: ${label}`}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {label}
                <div style={{ display: 'flex', flexDirection: 'column', opacity: isSorted ? 1 : 0.3 }}>
                    <span style={{ fontSize: '10px', lineHeight: '8px', color: isAsc ? 'var(--primary)' : 'currentColor' }}>▲</span>
                    <span style={{ fontSize: '10px', lineHeight: '8px', color: isSorted && !isAsc ? 'var(--primary)' : 'currentColor' }}>▼</span>
                </div>
            </div>
        </th>
    )
}
