"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, Globe, Layout, Clock, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-slate-50 selection:bg-sky-200">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 bg-dot-pattern opacity-100" />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-sky-50/50 via-transparent to-indigo-50/50" />

      {/* Header */}
      <header className="w-full relative z-10 flex h-20 items-center justify-between px-6 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Resolve Logo" width={40} height={40} style={{ width: 40, height: 40 }} className="rounded-xl object-contain" />
          <span className="text-xl font-bold tracking-tight text-slate-900">Resolve</span>
        </div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild className="font-bold text-slate-600 hover:text-slate-900">
            <Link href="/api/auth/signin">Login</Link>
          </Button>
          <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold px-6">
            Get Started
          </Button>
        </nav>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="w-full flex items-center justify-center min-h-[calc(100vh-80px)] px-6 pt-10 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-700 mb-8">
              <Zap className="mr-2 h-3.5 w-3.5" />
              Next Generation Enterprise IMS
            </div>
            <h1 className="text-7xl md:text-8xl font-black tracking-tight text-slate-900 mb-8 leading-[0.95]">
              Resolve Incidents <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Faster Than Ever.</span>
            </h1>
              <p className="max-w-[600px] mx-auto text-xl text-muted-foreground mb-12 leading-relaxed text-center">
                Empower your group companies with a unified, hierarchical incident management system. 
                Built for IT, Accounts, and Supply Chain excellence.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <Button size="lg" asChild className="rounded-full px-10 h-14 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  <Link href="/api/auth/signin">
                    Sign in to Resolve <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg bg-white shadow-sm hover:bg-slate-50 transition-all">
                  Documentation
                </Button>
              </div>
            </motion.div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-16 bg-white relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Resolve Logo" width={40} height={40} style={{ width: 40, height: 40 }} className="rounded-xl object-contain" />
              <span className="text-xl font-bold tracking-tight text-slate-900">Resolve</span>
            </div>
            <p className="text-sm text-slate-500 text-center md:text-left max-w-[300px]">
              The gold standard in corporate incident management and response tracking.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-10">
            <div className="flex flex-col gap-3">
              <span className="font-bold text-xs uppercase tracking-widest text-slate-900">Platform</span>
              <Link href="#" className="text-sm text-slate-500 hover:text-sky-600 transition-colors font-medium">Overview</Link>
              <Link href="#" className="text-sm text-slate-500 hover:text-sky-600 transition-colors font-medium">Security</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-bold text-xs uppercase tracking-widest text-slate-900">Resources</span>
              <Link href="#" className="text-sm text-slate-500 hover:text-sky-600 transition-colors font-medium">Documentation</Link>
              <Link href="#" className="text-sm text-slate-500 hover:text-sky-600 transition-colors font-medium">Help Center</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-bold text-xs uppercase tracking-widest text-slate-900">Legal</span>
              <Link href="#" className="text-sm text-slate-500 hover:text-sky-600 transition-colors font-medium">Privacy</Link>
              <Link href="#" className="text-sm text-slate-500 hover:text-sky-600 transition-colors font-medium">Terms</Link>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-16 pt-8 border-t border-slate-100 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          © 2026 Resolve Enterprise. Built for performance and reliability.
        </div>
      </footer>
    </div>
  );
}
