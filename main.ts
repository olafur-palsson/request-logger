import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Application } from "https://deno.land/x/oak/mod.ts";

const kv = await Deno.openKv();

const app = new Application();

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  const id = `${new Date().getTime()}`
  const data = {
    headers: ctx.request.headers,
    method: ctx.request.method,
    url: ctx.request.url.toString(),
    time: new Date().toISOString(),
    body: await ctx.request.body({ type: 'text'}).value
  }
  try {
    kv.set(['requests', id], data)
  } catch (e) {

  }
  console.log(data)
  kv.set([id], data)
});

app.use(async ctx => {
  // get n

  const last = Number(ctx.request.url.toString().split('/').pop())
  const response: any = { requests: [] }
  try {
    if (ctx.request.url && last) {
      let count = 0;
      for await (const entry of kv.list({ prefix: ['requests'] })) {
        response.requests.push(entry.value)
        if (count > last) {
          break;
        }

      }
    }
  } catch(e) {
    response.error = e
    console.error(e)
  }
  ctx.response.body = response
})

// Hello World!
app.use((ctx) => {
  ctx.response.body = "Success!";
});

await app.listen({ port: 8000 });
