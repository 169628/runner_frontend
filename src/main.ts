import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { formatCurrency } from './utils/formatCurrency'
import { swalHandler } from './utils/swalHandler'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.config.globalProperties.$formatCurrency = formatCurrency
app.config.globalProperties.$swal = swalHandler

app.mount('#app')
