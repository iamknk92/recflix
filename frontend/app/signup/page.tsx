"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import type { MBTIType } from "@/types";

const MBTI_TYPES: MBTIType[] = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    mbti: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (formData.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
        mbti: formData.mbti || undefined,
      });
      router.push("/");
    } catch (err: any) {
      setError(err.message || "회원가입에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-base">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-primary-600">
            RecFlix
          </Link>
          <p className="text-content-muted mt-2">맞춤형 영화 추천 플랫폼</p>
        </div>

        {/* Signup Form */}
        <div className="bg-surface-card rounded-card border border-border p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-content-primary mb-6">회원가입</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">
                이메일 *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">
                닉네임 *
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                className="input w-full"
                placeholder="닉네임을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">
                비밀번호 *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input w-full"
                placeholder="6자 이상"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">
                비밀번호 확인 *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input w-full"
                placeholder="비밀번호를 다시 입력"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">
                MBTI (선택)
              </label>
              <select
                name="mbti"
                value={formData.mbti}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="">선택 안함</option>
                {MBTI_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p className="text-xs text-content-subtle mt-1">
                MBTI를 입력하면 더 정확한 추천을 받을 수 있어요!
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed text-white font-medium rounded-md transition"
            >
              {isLoading ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <div className="mt-6 text-center text-content-muted">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary-500 hover:text-primary-400 transition">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
