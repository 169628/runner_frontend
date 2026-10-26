<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Ban, Calendar, Check, CircleAlert, ClipboardCheck, EyeOff, Globe, ImagePlus, Landmark, Link2, MapPin, Save, Send, X } from 'lucide-vue-next'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import EventStatusBadge from '@/components/EventStatusBadge.vue'
import SelectBox from '@/components/SelectBox.vue'
import { ApiError, createEvent, getAdminEvent, updateEvent, updateEventStatus } from '@/api'
import { CATEGORY_LABEL, COUNTIES, COUNTY_DISTRICTS, SOURCE_LABEL } from '@/config/constants'
import { formatDotDateTime } from '@/utils/formatDateTime'
import { swalHandler } from '@/utils/swalHandler'
import { isValidHttpsUrl } from '@/utils/validators'
import type { AdminEventDetail, AdminEventPayload, EventCategory } from '@/types'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id ? String(route.params.id) : null))
const event = ref<AdminEventDetail | null>(null)
const busy = ref<'' | 'save' | 'publish' | 'reject' | 'close'>('')
const errors = ref<Record<string, string>>({})

const emptyForm = (): AdminEventPayload => ({
  name: '',
  category: '' as EventCategory,
  county: '',
  district: '',
  venue: '',
  organizer: '',
  eventDate: '',
  registrationStart: '',
  registrationEnd: '',
  registrationUrl: '',
  description: '',
  coverUrl: '',
  divisions: [{ name: '', distanceKm: 0, startTime: '', feeNtd: 0 }],
})
const form = reactive<AdminEventPayload>(emptyForm())

watch(
  id,
  async (value) => {
    errors.value = {}
    if (!value) {
      event.value = null
      Object.assign(form, emptyForm())
      return
    }
    event.value = await getAdminEvent(value)
    const { name, category, county, district, venue, organizer, eventDate, registrationStart, registrationEnd, registrationUrl, description, coverUrl, divisions } = event.value
    Object.assign(form, { name, category, county, district, venue, organizer, eventDate, registrationStart, registrationEnd, registrationUrl, description, coverUrl, divisions: divisions.map((d) => ({ ...d })) })
  },
  { immediate: true },
)

const mode = computed(() => (!id.value ? 'new' : event.value?.status ?? 'loading'))
const title = computed(() => (mode.value === 'new' ? '新增活動' : event.value?.name ?? ''))

const categoryOptions = (Object.keys(CATEGORY_LABEL) as EventCategory[]).map((v) => ({ value: v, label: CATEGORY_LABEL[v] }))
const countyOptions = COUNTIES.map((c) => ({ value: c, label: c }))
const districtOptions = computed(() => (COUNTY_DISTRICTS[form.county] ?? []).map((d) => ({ value: d, label: d })))
watch(() => form.county, (county) => {
  if (form.district && !COUNTY_DISTRICTS[county]?.includes(form.district)) form.district = ''
})

const addDivision = () => form.divisions.push({ name: '', distanceKm: 0, startTime: '', feeNtd: 0 })
const removeDivision = (i: number) => form.divisions.splice(i, 1)

// 封面：mock 模式直接用本機預覽；串接後端時改為 getCoverUploadUrl → PUT 到 S3 → 填入 fileUrl
const fileInput = ref<HTMLInputElement>()
function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) return swalHandler.error('圖片需小於 5MB')
  form.coverUrl = URL.createObjectURL(file)
}

function validate() {
  const next: Record<string, string> = {}
  if (!form.name.trim()) next.name = '請輸入活動名稱'
  if (!form.category) next.category = '請選擇分類'
  if (!form.county) next.county = '請選擇縣市'
  if (!form.district) next.district = '請選擇鄉鎮區'
  if (!form.eventDate) next.eventDate = '請選擇活動日期'
  if (form.registrationStart && form.registrationEnd && form.registrationStart > form.registrationEnd) next.registrationEnd = '報名截止需晚於報名開始'
  if (form.registrationEnd && form.eventDate && form.registrationEnd > form.eventDate) next.registrationEnd = '報名截止需早於活動日期'
  if (!isValidHttpsUrl(form.registrationUrl)) next.registrationUrl = '請輸入以 https:// 開頭的有效網址'
  errors.value = next
  return Object.keys(next).length === 0
}

const payload = (): AdminEventPayload => ({
  ...form,
  name: form.name.trim(),
  divisions: form.divisions.filter((d) => d.name.trim()).map((d) => ({ ...d, distanceKm: Number(d.distanceKm), feeNtd: Number(d.feeNtd) })),
})

async function run(action: typeof busy.value, task: () => Promise<void>) {
  busy.value = action
  try {
    await task()
  } catch (err) {
    if (err instanceof ApiError) {
      errors.value = err.fields
      if (!Object.keys(err.fields).length) swalHandler.error(err.message)
    }
  } finally {
    busy.value = ''
  }
}

const backToList = () => router.push({ name: 'admin-events' })

const create = () => validate() && run('save', async () => {
  await createEvent(payload())
  swalHandler.success('活動已建立並發布')
  backToList()
})

const save = () => validate() && run('save', async () => {
  event.value = await updateEvent(id.value!, payload())
  swalHandler.success('已儲存變更')
})

const publish = () => validate() && run('publish', async () => {
  await updateEvent(id.value!, payload())
  await updateEventStatus(id.value!, 'PUBLISHED')
  swalHandler.success('已通過並發布')
  backToList()
})

async function reject() {
  if (!(await swalHandler.confirm('確定要棄用這個活動嗎？', '棄用後不會出現在前台，且無法再發布。', '棄用'))) return
  run('reject', async () => {
    await updateEventStatus(id.value!, 'REJECTED')
    swalHandler.success('已棄用')
    backToList()
  })
}

async function closeEvent() {
  if (!(await swalHandler.confirm('確定要下架這個活動嗎？', '下架後前台活動列表將不再顯示此活動。', '下架'))) return
  run('close', async () => {
    await updateEventStatus(id.value!, 'CLOSED')
    swalHandler.success('已下架')
    backToList()
  })
}

const sourceText = computed(() => {
  const e = event.value
  if (!e) return ''
  return e.sourceName ? `${SOURCE_LABEL[e.source]}（${e.sourceName}）` : SOURCE_LABEL[e.source]
})
</script>

<template>
  <AdminPageHeader
    :crumbs="[{ label: '管理後台', to: '/admin' }, { label: '活動管理', to: '/admin/events' }, { label: mode === 'new' ? '新增活動' : '編輯活動' }]"
    :title="title"
  >
    <template v-if="event" #badge><EventStatusBadge :status="event.status" /></template>
    <template #actions>
      <button type="button" class="btn btn-outline h-11 px-5" @click="backToList">取消</button>
    </template>
  </AdminPageHeader>

  <div v-if="mode === 'loading'" class="mt-7 h-[720px] animate-pulse rounded-3xl bg-surface-2" />

  <div v-else class="mt-7 grid items-start gap-6 xl:grid-cols-[1fr_340px]">
    <!-- 活動內容 -->
    <form class="card rounded-3xl p-6 lg:p-7" novalidate @submit.prevent>
      <h2 class="text-base font-bold text-ink">活動內容</h2>

      <div class="mt-6">
        <label class="field-label">活動名稱 *</label>
        <label class="input-box h-11 text-sm" :class="{ 'is-error': errors.name }"><input v-model="form.name" placeholder="輸入活動名稱" /></label>
        <p v-if="errors.name" class="field-error"><CircleAlert class="size-3.5" />{{ errors.name }}</p>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div>
          <label class="field-label">活動分類 *</label>
          <SelectBox v-model="form.category" size="sm" :options="categoryOptions" placeholder="選擇分類" :error="!!errors.category" />
        </div>
        <div>
          <label class="field-label">縣市 *</label>
          <SelectBox v-model="form.county" size="sm" :options="countyOptions" placeholder="選擇縣市" :error="!!errors.county" />
        </div>
        <div>
          <label class="field-label">鄉鎮區 *</label>
          <SelectBox v-model="form.district" size="sm" :options="districtOptions" placeholder="選擇鄉鎮區" :disabled="!form.county" :error="!!errors.district" />
        </div>
      </div>
      <p v-if="errors.category || errors.county || errors.district" class="field-error">
        <CircleAlert class="size-3.5" />{{ errors.category || errors.county || errors.district }}
      </p>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label class="field-label">活動地點</label>
          <label class="input-box h-11 text-sm"><MapPin class="size-4 shrink-0 text-ink-2" /><input v-model="form.venue" placeholder="集合 / 起跑地點" /></label>
        </div>
        <div>
          <label class="field-label">主辦單位</label>
          <label class="input-box h-11 text-sm"><Landmark class="size-4 shrink-0 text-ink-2" /><input v-model="form.organizer" placeholder="輸入主辦單位" /></label>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div
          v-for="f in [
            { key: 'eventDate', label: '活動日期 *' },
            { key: 'registrationStart', label: '報名開始' },
            { key: 'registrationEnd', label: '報名截止' },
          ] as const" :key="f.key"
        >
          <label class="field-label">{{ f.label }}</label>
          <label class="input-box h-11 text-sm" :class="{ 'is-error': errors[f.key] }">
            <Calendar class="size-4 shrink-0 text-ink-2" /><input v-model="form[f.key]" type="date" />
          </label>
        </div>
      </div>
      <p v-if="errors.eventDate || errors.registrationEnd" class="field-error">
        <CircleAlert class="size-3.5" />{{ errors.eventDate || errors.registrationEnd }}
      </p>

      <div class="mt-6">
        <label class="field-label">官方報名連結 *</label>
        <label class="input-box h-11 text-sm" :class="{ 'is-error': errors.registrationUrl }">
          <Link2 class="size-4 shrink-0 text-ink-2" /><input v-model="form.registrationUrl" type="url" placeholder="https://" />
        </label>
        <p v-if="errors.registrationUrl" class="field-error"><CircleAlert class="size-3.5" />{{ errors.registrationUrl }}</p>
      </div>

      <div class="mt-6">
        <label class="field-label">活動簡介</label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-sm leading-relaxed outline-none placeholder:text-text-lo focus:border-accent"
          placeholder="簡單介紹路線特色、適合對象…"
        />
      </div>

      <div class="mt-6">
        <div class="flex items-center justify-between">
          <label class="text-[13px] font-bold text-ink">賽事組別</label>
          <button type="button" class="text-[13px] font-bold text-accent hover:underline" @click="addDivision">+ 新增組別</button>
        </div>
        <div v-for="(d, i) in form.divisions" :key="i" class="mt-3 grid grid-cols-[1fr_auto] items-center gap-2.5 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <input v-model="d.name" class="col-span-2 h-10 rounded-lg border border-line bg-paper/60 px-3 text-sm outline-none focus:border-accent md:col-span-1" placeholder="組別名稱" />
          <label class="flex h-10 items-center gap-1.5 rounded-lg border border-line bg-paper/60 px-3 text-sm">
            <input v-model.number="d.distanceKm" type="number" min="0" step="0.1" class="w-full min-w-0 bg-transparent font-display outline-none" />
            <span class="text-xs text-text-lo">km</span>
          </label>
          <input v-model="d.startTime" type="time" class="h-10 rounded-lg border border-line bg-paper/60 px-3 font-display text-sm outline-none" />
          <label class="flex h-10 items-center gap-1.5 rounded-lg border border-line bg-paper/60 px-3 text-sm">
            <span class="text-xs text-text-lo">NT$</span>
            <input v-model.number="d.feeNtd" type="number" min="0" step="50" class="w-full min-w-0 bg-transparent font-display outline-none" />
          </label>
          <button type="button" class="flex size-8 items-center justify-center text-ink-2 hover:text-danger" aria-label="移除組別" @click="removeDivision(i)"><X class="size-4" /></button>
        </div>
      </div>
    </form>

    <!-- 右欄 -->
    <div class="flex flex-col gap-4">
      <section class="card p-5">
        <p class="text-[13px] font-bold text-ink">封面圖片</p>
        <input ref="fileInput" type="file" accept="image/jpeg,image/png" class="hidden" @change="onCoverChange" />
        <div v-if="form.coverUrl" class="relative mt-3 h-[150px] rounded-xl bg-cover bg-center" :style="{ backgroundImage: `url(${form.coverUrl})` }">
          <button type="button" class="absolute right-2.5 bottom-2.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink" @click="fileInput?.click()">更換</button>
        </div>
        <button v-else type="button" class="mt-3 flex h-[180px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-line bg-paper/60 hover:bg-paper" @click="fileInput?.click()">
          <ImagePlus class="size-6 text-ink-2" />
          <span class="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink">上傳封面</span>
          <span class="text-xs text-ink-2">建議 1200×630，JPG / PNG</span>
        </button>
      </section>

      <!-- 新增：直接發布 -->
      <section v-if="mode === 'new'" class="card p-5">
        <h2 class="flex items-center gap-2 text-base font-bold text-ink"><Send class="size-[18px]" />發布</h2>
        <p class="mt-3 text-[13px] leading-relaxed text-ink-2">手動新增的活動不需審核，建立後會直接以「已發布」狀態顯示在前台活動列表。</p>
        <dl class="mt-4 flex flex-col gap-2.5 rounded-xl bg-paper/70 px-3.5 py-3 text-xs">
          <div class="flex justify-between"><dt class="text-ink-2">來源</dt><dd class="font-bold">手動新增</dd></div>
          <div class="flex justify-between"><dt class="text-ink-2">建立後狀態</dt><dd class="font-bold text-accent">已發布</dd></div>
        </dl>
        <button type="button" class="btn btn-primary mt-4 h-10 w-full" :disabled="!!busy" @click="create">
          <Check class="size-4" />{{ busy ? '建立中…' : '建立並發布' }}
        </button>
      </section>

      <!-- 待審核 -->
      <section v-else-if="mode === 'PENDING' && event" class="card border-2 border-warn p-5">
        <h2 class="flex items-center gap-2 text-base font-bold text-ink"><ClipboardCheck class="size-[18px] text-warn" />審核</h2>
        <ol class="mt-4 flex items-center gap-2 text-xs">
          <li class="flex items-center gap-1.5 text-ink-2"><span class="flex size-[18px] items-center justify-center rounded-full bg-accent text-white"><Check class="size-3" :stroke-width="3" /></span>{{ SOURCE_LABEL[event.source] }}</li>
          <li class="h-px flex-1 bg-line" />
          <li class="flex items-center gap-1.5 font-bold text-ink"><span class="size-[18px] rounded-full bg-warn" />待審核</li>
          <li class="h-px flex-1 bg-line" />
          <li class="flex items-center gap-1.5 text-ink-2"><span class="size-[18px] rounded-full bg-surface-2" />已發布</li>
        </ol>
        <dl class="mt-4 flex flex-col gap-2.5 rounded-xl bg-paper/70 px-3.5 py-3 text-xs">
          <div class="flex justify-between gap-3"><dt class="shrink-0 text-ink-2">來源</dt><dd class="font-bold">{{ sourceText }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="shrink-0 text-ink-2">送審時間</dt><dd class="font-display font-semibold">{{ event.submittedAt ? formatDotDateTime(event.submittedAt) : '—' }}</dd></div>
        </dl>
        <div class="mt-4 grid grid-cols-2 gap-2.5">
          <button type="button" class="btn h-10 border border-danger bg-surface text-danger hover:bg-heart-soft" :disabled="!!busy" @click="reject"><Ban class="size-4" />棄用</button>
          <button type="button" class="btn btn-primary h-10" :disabled="!!busy" @click="publish"><Check class="size-4" />{{ busy === 'publish' ? '發布中…' : '通過並發布' }}</button>
        </div>
      </section>

      <!-- 已發布 -->
      <section v-else-if="mode === 'PUBLISHED' && event" class="card p-5">
        <h2 class="flex items-center gap-2 text-base font-bold text-ink"><Globe class="size-[18px] text-accent" />發布狀態</h2>
        <p class="mt-3 text-[13px] leading-relaxed text-ink-2">此活動目前顯示在前台活動列表，儲存後會立即更新前台內容。</p>
        <dl class="mt-4 flex flex-col gap-2.5 rounded-xl bg-paper/70 px-3.5 py-3 text-xs">
          <div class="flex justify-between gap-3"><dt class="shrink-0 text-ink-2">來源</dt><dd class="font-bold">{{ SOURCE_LABEL[event.source] }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="shrink-0 text-ink-2">發布時間</dt><dd class="font-display font-semibold">{{ event.publishedAt ? formatDotDateTime(event.publishedAt) : '—' }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="shrink-0 text-ink-2">最後更新</dt><dd class="font-display font-semibold">{{ formatDotDateTime(event.updatedAt) }}<template v-if="event.updatedBy"> · {{ event.updatedBy }}</template></dd></div>
        </dl>
        <div class="mt-4 grid grid-cols-2 gap-2.5">
          <button type="button" class="btn btn-outline h-10" :disabled="!!busy" @click="closeEvent"><EyeOff class="size-4" />下架</button>
          <button type="button" class="btn btn-primary h-10" :disabled="!!busy" @click="save"><Save class="size-4" />{{ busy === 'save' ? '儲存中…' : '儲存變更' }}</button>
        </div>
      </section>

      <!-- 已棄用 / 已下架：只能修改內容 -->
      <section v-else-if="event" class="card p-5">
        <h2 class="flex items-center gap-2 text-base font-bold text-ink">活動狀態 <EventStatusBadge :status="event.status" /></h2>
        <p class="mt-3 text-[13px] leading-relaxed text-ink-2">此活動目前不會顯示在前台。</p>
        <button type="button" class="btn btn-primary mt-4 h-10 w-full" :disabled="!!busy" @click="save"><Save class="size-4" />儲存變更</button>
      </section>
    </div>
  </div>
</template>
