// "use client";

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useToast } from '@/components/ToastProvider';
// import Link from 'next/link';

// export default function RegisterForm() {
//     const [name, setName] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading] = useState(false);
//     const router = useRouter();
//     const { toast } = useToast();

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);

//         try {
//             const res = await fetch('/api/auth/register', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ name, email, password }),
//             });

//             const data = await res.json();

//             if (res.ok) {
//                 toast('Registered successfully! Please log in.', 'success');
//                 router.push('/login');
//             } else {
//                 toast(data.error || 'Failed to register', 'error');
//             }
//         } catch (error) {
//             toast('Network error. Please try again.', 'error');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//             <div className="rounded-md shadow-sm -space-y-px">
//                 <div>
//                     <label htmlFor="name" className="sr-only">Full Name</label>
//                     <input
//                         id="name"
//                         name="name"
//                         type="text"
//                         autoComplete="name"
//                         required
//                         className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm bg-white dark:bg-gray-700"
//                         placeholder="Full Name"
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                     />
//                 </div>
//                 <div>
//                     <label htmlFor="email-address" className="sr-only">Email address</label>
//                     <input
//                         id="email-address"
//                         name="email"
//                         type="email"
//                         autoComplete="email"
//                         required
//                         className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm bg-white dark:bg-gray-700"
//                         placeholder="Email address"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                     />
//                 </div>
//                 <div>
//                     <label htmlFor="password" className="sr-only">Password</label>
//                     <input
//                         id="password"
//                         name="password"
//                         type="password"
//                         autoComplete="new-password"
//                         required
//                         className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm bg-white dark:bg-gray-700"
//                         placeholder="Password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                     />
//                 </div>
//             </div>

//             <div>
//                 <button
//                     type="submit"
//                     disabled={loading}
//                     className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
//                 >
//                     {loading ? 'Registering...' : 'Register'}
//                 </button>
//             </div>

//             <div className="text-center text-sm">
//                 <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
//                 <Link href="/login" className="font-medium text-accent hover:text-accent/80">
//                     Sign in here
//                 </Link>
//             </div>
//         </form>
//     );
// }
