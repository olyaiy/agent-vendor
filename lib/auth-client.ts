import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
import { 
    anonymousClient, 
    usernameClient, 
    adminClient 
} from "better-auth/client/plugins"


export const authClient =  createAuthClient({
    //you can pass client configuration here
    plugins: [
        anonymousClient(),
        usernameClient(),
        adminClient()
    ]
})


// sign in with google
export const signIn = async () =>{
    const data = await authClient.signIn.social({
        provider: "google"
    })

    return data
}