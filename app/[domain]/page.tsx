import { AppBskyActorDefs } from "@atproto/api"
import { Check, X } from "lucide-react"
import { agent } from "@/lib/atproto"
import { prisma } from "@/lib/db"
import { hasExplicitSlur } from "@/lib/slurs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Profile } from "@/components/profile"
import { Stage } from "@/components/stage"

export function generateMetadata({ params }: { params: { domain: string } }) {
  const domain = params.domain
  return {
    title: `${domain} - Get your own directioners.social handle for Bluesky`,
    description: `Join the ${domain} community and get your own personalized handle.`,
  }
}

export default async function IndexPage({
  params,
  searchParams,
}: {
  params: {
    domain: string
  }
  searchParams: {
    handle?: string
    "new-handle"?: string
  }
}) {
  const domain = params.domain
  let handle = searchParams.handle
  let newHandle = searchParams["new-handle"]
  let profile: AppBskyActorDefs.ProfileView | undefined
  let error1: string | undefined
  let error2: string | undefined

  if (handle) {
    try {
      if (!handle.includes(".")) {
        handle += ".bsky.social"
      }
      console.log("fetching profile", handle)
      const actor = await agent.getProfile({
        actor: handle,
      })
      if (!actor.success) throw new Error("fetch was not a success")
      profile = actor.data
    } catch (e) {
      console.error(e)
      error1 = (e as Error)?.message ?? "unknown error"
    }

    if (newHandle && profile) {
      newHandle = newHandle.trim().toLowerCase()
      if (!newHandle.includes(".")) {
        newHandle += "." + domain
      }
      if (!error1) {
        // regex: (alphanumeric, -, _).(domain)
        const validHandle = newHandle.match(
          new RegExp(`^[a-zA-Z0-9-_]+.${domain}$`)
        )
        if (validHandle) {
          try {
            const handle = newHandle.replace(`.${domain}`, "")
            if (hasExplicitSlur(handle)) {
              throw new Error("slur")
            }

            if (domain === "army.social" && RESERVED.includes(handle)) {
              throw new Error("reserved")
            }

            const existing = await prisma.user.findFirst({
              where: { handle },
              include: { domain: true },
            })
            if (existing && existing.domain.name === domain) {
              if (existing.did !== profile.did) {
                error2 = "handle taken"
              }
            } else {
              await prisma.user.create({
                data: {
                  handle,
                  did: profile.did,
                  domain: {
                    connectOrCreate: {
                      where: { name: domain },
                      create: { name: domain },
                    },
                  },
                },
              })
            }
          } catch (e) {
            console.error(e)
            error2 = (e as Error)?.message ?? "unknown error"
          }
        } else {
          error2 = "invalid handle"
        }
      }
    }
  }

  const count = await prisma.user.count({
    where: { domain: { name: domain } },
  });
  
  return (
    <>
      <div className="bg-1d-low-opacity" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-7xl overflow-y-auto">
          <div className="overflow-hidden rounded-2xl backdrop-blur-sm ">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column */}
              <div className="left-column bg-muted-background space-y-10 border-white/10 bg-popover/20 p-8 md:border-r">
                <div className="text-center">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-3xl md:text-5xl lg:text-6xl">
                    Get your own {domain} <br className="hidden sm:inline" />
                    handle for Bluesky
                  </h1>
                  <p className="max-w-[700px] text-lg sm:text-xl">
                    It&apos;s super easy, just follow the steps!
                  </p>
                </div>
                <div className="circle-container">
                    <span className="circle blue"></span>
                    <span className="circle green"></span>
                    <span className="circle red"></span>
                    <span className="circle yellow"></span>
                    <span className="circle irish-flag"></span>
                  </div>
                <div className="space-y-6">
                  <div className="mb-6 flex items-center justify-center gap-2">
                    <svg className="size-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="header-text text-2xl font-bold">Community Statistics</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 text-center">
                      <p className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-3xl md:text-5xl lg:text-6xl">
                          {count}
                        </p>
                        <p className="mt-2 text-sm">
                          Members in the {domain} community
                        </p>
                      <p className="text-sm">
                        Join our growing community by getting your own handle!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="right-column bg-popover/20 p-6">
                {/* Right column content */}
                <div>
                  <Stage title="Step 1: Enter Your Current Handle" number={1}>
                    <form>
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <div className="flex w-full max-w-sm items-center space-x-2">
                          {newHandle && (
                            <input type="hidden" name="new-handle" value="" />
                          )}
                          <Input
                            type="text"
                            name="handle"
                            placeholder="example.bsky.social"
                            defaultValue={handle}
                            required
                          />
                          <Button type="submit">Submit</Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enter your existing Bluesky handle (without the @ symbol).
                        </p>
                        {error1 && (
                          <p className="flex flex-row items-center gap-2 text-sm text-red-500">
                            <X className="size-4" /> Handle not found - please try again.
                          </p>
                        )}
                        {profile && (
                          <>
                            <p className="text-muted-forground mt-4 flex flex-row items-center gap-2 text-sm">
                              <Check className="size-4 text-green-500" /> Account verified successfully.
                            </p>
                            <Profile profile={profile} className="mt-4 h-auto w-1/2" />
                          </>
                        )}
                      </div>
                    </form>
                  </Stage>

                  <Stage title="Step 2: Choose Your New Handle" number={2} disabled={!profile}>
                    <form>
                      <input type="hidden" name="handle" value={handle} />
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <div className="flex w-full max-w-sm items-center space-x-2">
                          <Input
                            type="text"
                            name="new-handle"
                            placeholder={`example.${domain}`}
                            defaultValue={newHandle}
                          />
                          <Button type="submit">Submit</Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enter the handle you&apos;d like to use with the {domain} domain (without the @ symbol).
                        </p>
                        {error2 && (
                          <p className="text-sm text-red-500">
                            {(() => {
                              switch (error2) {
                                case "handle taken":
                                  return "This handle is already taken - please try another."
                                case "invalid handle":
                                case "slur":
                                  return "Invalid handle - please try another."
                                case "reserved":
                                  return "This handle is reserved - please try another."
                                default:
                                  return "An error occurred - please try again."
                              }
                            })()}
                          </p>
                        )}
                      </div>
                    </form>
                  </Stage>

                  <Stage
                    title="Step 3: Update Your Handle in the Bluesky App"
                    number={3}
                    disabled={!newHandle || !!error2}
                    last
                  >
                    <p className="max-w-lg text-sm">
                      Open the Bluesky app and navigate to <strong>Settings &gt; Advanced &gt; Change My Handle</strong>. Select <strong>&quot;I have my own domain&quot;</strong> and enter {newHandle ? `"${newHandle}"` : "your new handle"}. Finally, tap <strong>&quot;Verify DNS Record&quot;</strong>.
                    </p>
                  </Stage>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


const RESERVED = [
  "Jungkook",
  "JeonJungkook",
  "Jeon",
  "JK",
  "JJK",
  "Kim",
  "KimTaehyung",
  "V",
  "Taehyung",
  "Tae",
  "Jin",
  "Seokjin",
  "KimSeokjin",
  "RM",
  "Namjoon",
  "Nam",
  "KimNamjoon",
  "MinYoongi",
  "Yoongi",
  "Yoon",
  "AgustD",
  "MYG",
  "Suga",
  "PJM",
  "Jimin",
  "ParkJimin",
  "Park",
  "Abcdefghi__lmnopqrsvuxyz",
  "JM",
  "UarMyHope",
  "Rkrive",
  "THV",
  "KTH",
  "SBT",
  "BANGPD",
  "projeto",
  "army",
  "armys ",
  "info",
  "projects",
  "Pic",
  "New",
  "Babys",
].map((x) => x.toLowerCase())
