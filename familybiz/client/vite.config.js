import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'FamilyBiz',
        short_name: 'FamilyBiz',
        description: 'Quản lý doanh thu, công nợ và bảng giá gia đình',
        theme_color: '#0f766e',
        background_color: '#f5f7f8',
        display: 'standalone',
        start_url: '/',
        icons: []
      },
      workbox: { navigateFallback: 'index.html' }
    })
  ]
})
