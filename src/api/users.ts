// A07–A10、A13、A15 目前登入者（/me）
import request from './request'
import type { ApiSuccess, HealthAnalysis, HealthRange, RaceRecommendation, User } from '@/types'

export const getMe = () => request.get<ApiSuccess<User>>('/me').then((res) => res.data.data)

export const updateNickname = (nickname: string) =>
  request.patch<ApiSuccess<{ id: number; nickname: string }>>('/me', { nickname }).then((res) => res.data.data)

export const changePassword = (body: { currentPassword: string; newPassword: string }) =>
  request.put<ApiSuccess<{ mustChangePassword: boolean }>>('/me/password', body).then((res) => res.data.data)

export const deleteAccount = () => request.delete('/me')

export const getRaceRecommendation = () =>
  request.get<ApiSuccess<RaceRecommendation>>('/me/race-recommendation').then((res) => res.data.data)

export const getHealthAnalysis = (range: HealthRange = '8W') =>
  request.get<ApiSuccess<HealthAnalysis>>('/me/health-analysis', { params: { range } }).then((res) => res.data.data)
