// "use client";

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useToast } from '@/components/ToastProvider';
// import Link from 'next/link';

// export default function LoginPage() {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading] = useState(false);
//     const router = useRouter();
//     const { toast } = useToast();

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);

//         try {
//             const res = await fetch('/api/auth/login', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email, password }),
//             });

//             const data = await res.json();

//             if (res.ok) {
//                 toast(data.message || 'Logged in successfully', 'success');
//                 router.push('/dashboard');
//                 router.refresh();
//             } else {
//                 toast(data.error || 'Failed to login', 'error');
//             }
//         } catch (error) {
//             toast('Network error. Please try again.', 'error');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-primary)' }}>
//             <div className="max-w-md w-full space-y-8 p-8 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
//                 <div>
//                     <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
//                         Sign in to your account
//                     </h2>
//                 </div>
//                 <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//                     <div className="rounded-md shadow-sm" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                         <div>
//                             <label htmlFor="email-address" className="sr-only">Email address</label>
//                             <input
//                                 id="email-address"
//                                 name="email"
//                                 type="email"
//                                 autoComplete="email"
//                                 required
//                                 className="search-input"
//                                 placeholder="Email address"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                             />
//                         </div>
//                         <div>
//                             <label htmlFor="password" className="sr-only">Password</label>
//                             <input
//                                 id="password"
//                                 name="password"
//                                 type="password"
//                                 autoComplete="current-password"
//                                 required
//                                 className="search-input"
//                                 placeholder="Password"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                             />
//                         </div>
//                     </div>

//                     <div>
//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className="btn-primary"
//                             style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}
//                         >
//                             {loading ? 'Signing in...' : 'Sign in'}
//                         </button>
//                     </div>

//                     <div style={{ textAlign: 'center', fontSize: '14px' }}>
//                         <span style={{ color: 'var(--text-muted)' }}>Don&apos;t have an account? </span>
//                         <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
//                             Register here
//                         </Link>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }
