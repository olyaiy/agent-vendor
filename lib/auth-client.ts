import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
import { anonymousClient } from "better-auth/client/plugins"
import { usernameClient } from "better-auth/client/plugins"



export const authClient =  createAuthClient({
    //you can pass client configuration here
    plugins: [
        anonymousClient(),
        usernameClient()
    ]
})


// sign in with google
export const signIn = async () =>{
    const data = await authClient.signIn.social({
        provider: "google"
    })

    return data
}