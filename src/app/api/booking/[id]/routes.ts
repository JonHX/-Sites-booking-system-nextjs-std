/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req:Request, context:any) {
    const { params } = context;
    

    return new Response(JSON.stringify(params),{
        status:200,
        headers:{ "Content-Type": "application/json" }
    })
}