"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function SignupPage() {

    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSignup(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log("Signup button clicked");
        const formData = new FormData(e.currentTarget);
        console.log(username, email, password);
        const res = await fetch("/api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password }),
        });
        if (res.ok) {
            router.push("/login");
            console.log("Signup successful");
        } else {
            // TODO: Show error message to user
            console.error("Failed to signup");
        }
    }

    return (
        <div className="flex flex-col flex-1 items-center justify-center">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Signup for an account</CardTitle>
                    <CardDescription>
                        Enter your email below to signup for an account
                    </CardDescription>
                    <CardAction>
                        <Button variant="link" asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                    </CardAction>
                </CardHeader>
                <form onSubmit={handleSignup}>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="xXblackjack_winnahXx"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        <Button type="submit" className="w-full">
                            Signup
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
