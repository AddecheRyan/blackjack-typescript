"use client"

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
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter();

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const username = formData.get("username");
        const password = formData.get("password");
        console.log(username, password, "first step");
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password }),
        })
        const data = await res.json();
        console.log(data, "third step");
        if (data.success) {
            router.push("/dashboard")
            console.log("Login successful");
        } else {
            // TODO: Show error message to user
            console.error("Failed to login");
        }
    }


    return (
        <div className="flex flex-col flex-1 items-center justify-center">
            <Card className="w-full max-w-sm">
            <form onSubmit={handleSubmit}>
            <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                Enter your username below to login to your account
                </CardDescription>
                <CardAction>
                <Button variant="link" asChild>
                    <Link href="/signup">Sign Up</Link>
                </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                
                <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="xXblackjack_winnahXx"
                        required
                    />
                    </div>
                    <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                    </div>
                    <Input id="password" name="password" type="password" required />
                    </div>
                </div>
                
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full">
                Login
                </Button>
            </CardFooter>
            </form>
            </Card>
        </div>
    )
}
