import Swal from 'sweetalert2'

// SweetAlert2 封裝：統一 Pacer 的按鈕顏色與字型
const base = Swal.mixin({
  confirmButtonColor: '#4A6F5C',
  cancelButtonColor: '#6F6760',
  customClass: { popup: 'font-body rounded-3xl' },
})

const toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: false,
})

export const swalHandler = {
  success: (title: string, text?: string) => toast.fire({ icon: 'success', title, text }),
  error: (title: string, text?: string) => toast.fire({ icon: 'error', title, text }),
  info: (title: string, text?: string) => toast.fire({ icon: 'info', title, text }),
  alert: (title: string, text?: string) => base.fire({ icon: 'warning', title, text, confirmButtonText: '知道了' }),
  async confirm(title: string, text?: string, confirmButtonText = '確定') {
    const result = await base.fire({ icon: 'question', title, text, showCancelButton: true, confirmButtonText, cancelButtonText: '取消' })
    return result.isConfirmed
  },
}

export type SwalHandler = typeof swalHandler
