import React from 'react'

export function Skeleton({ width, height, radius = '8px', className = '' }) {
  return (
    <div
      className={`skeleton-pulse ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: radius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="120px" height="14px" />
        <Skeleton width="80px" height="24px" radius="12px" />
      </div>
      <Skeleton width="85%" height="16px" />
      <Skeleton width="60%" height="14px" />
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <Skeleton width="70px" height="28px" radius="8px" />
        <Skeleton width="70px" height="28px" radius="8px" />
        <Skeleton width="70px" height="28px" radius="8px" />
      </div>
    </div>
  )
}

export function SkeletonKPI() {
  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flex: '1', minWidth: '140px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <Skeleton width="60px" height="12px" />
      <Skeleton width="80px" height="28px" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <Skeleton width={`${50 + Math.random() * 40}%`} height="16px" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonList({ count = 3, type = 'card' }) {
  const Component = type === 'card' ? SkeletonCard : type === 'kpi' ? SkeletonKPI : SkeletonCard
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}
