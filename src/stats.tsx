import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { useEffect, useMemo, useState } from "preact/hooks"

export default function Stats({ knownEans }: {
    knownEans: {
        [key: string]: {
            name: string,
            alcohol: number,
            ml: number
        }
    },
    setKnownEans: Function
}) {
    const [stats, setStats] = useState<{
        ean: string,
        username: string,
        timestamp: number
    }[]>([])
    const categories = ['Drinks', 'Users', 'Log']
    const drinkStats = useMemo(() => {
        const uniqueDrinks = [...new Set(stats.map(item => item.ean))]
        return uniqueDrinks.map(drink => {
            return {
                drink,
                drinkObj: knownEans[drink as keyof typeof knownEans],
                count: stats.filter(item => item.ean === drink).length,
                leader: stats.filter(item => item.ean === drink).reduce((acc, item) => {
                    if (!acc[item.username]) {
                        acc[item.username] = 0
                    }
                    acc[item.username]++
                    return acc
                }, {} as Record<string, number>)
            }
        })
    }, [stats])
    const userStats = useMemo(() => {
        const uniqueUsers = [...new Set(stats.map(item => item.username))]
        return uniqueUsers.map(user => {
            return {
                user,
                count: stats.filter(item => item.username === user).length,
                leader: stats.filter(item => item.username === user).reduce((acc, item) => {
                    if (!acc[item.ean]) {
                        acc[item.ean] = 0
                    }
                    acc[item.ean]++
                    return acc
                }, {} as Record<string, number>)
            }
        })
    }, [stats])

    const logStats = useMemo(() => {
        return stats.sort((a, b) => b.timestamp - a.timestamp).map(item => {
            return {
                ean: item.ean,
                username: item.username,
                timestamp: new Date(item.timestamp).toLocaleString(),
                drinkObj: knownEans[item.ean as keyof typeof knownEans]
            }
        }
        )
    }, [stats])
    const calculatePromille = (user: string) => {
        const calculateBACAtTime = (time: number) => {
            const timeInSeconds = time / 1000;
            // Filter user's drinks consumed before the given time
            const consumedDrinks = stats.filter(drink => drink.timestamp <= time && drink.username === user);

            // Calculate total consumed alcohol based on timestamps
            const consumedAlcohol = consumedDrinks.reduce((acc, drink) => {
                const drinkObject = knownEans[drink.ean as keyof typeof knownEans];
                if (drinkObject) {
                    acc += drinkObject.alcohol * (drinkObject.ml / 1000);
                }
                return acc;
            }, 0);

            // Calculate time elapsed since last drink
            const lastDrinkTime = consumedDrinks.length > 0 ? consumedDrinks[0].timestamp / 1000 : 0;
            const elapsedTime = timeInSeconds - lastDrinkTime;
            // Eliminate alcohol over time
            const eliminatedAlcohol = Math.min(0.15, elapsedTime / 3600) * consumedAlcohol;
            // Calculate BAC (promille in this case, conversion factor might be needed)
            const BAC = Math.max(0, consumedAlcohol - eliminatedAlcohol) / 85 * 10; // Assuming weight in kg
            return BAC.toFixed(2);
        };

        // Return a function to calculate BAC at any given time
        return calculateBACAtTime(Date.now());
    }
    const userPromille = useMemo(() => {
        const uniqueUsers = [...new Set(stats.map(item => item.username))]
        return uniqueUsers.reduce((acc, user) => {
            acc[user] = calculatePromille(user)
            return acc
        }, {} as Record<string, string>)
    }, [stats])
    const [expanded, setExpanded] = useState(-1)
    useEffect(() => {
        fetch('https://n8n.rimraf.de/webhook/track-drink-stats').then(res => res.json()).then((data) => {
            setStats(data.map((i: any) => ({ ...i, timestamp: Number(i.timestamp) })))
        })
    }, [])
    return (<>
        <div className="flex flex-col rounded-md space-y-4 px-4">
            {categories.map((item, index) => {
                return <div key={index} className="border-b border-gray-200 cursor-pointer">
                    <div className="flex justify-between items-center py-4" onClick={() => {
                        if (expanded === index) {
                            setExpanded(-1)
                        } else {
                            setExpanded(index)
                        }
                    }}>
                        <div className="text-lg font-semibold">{index + 1}. {item}</div>
                        <div>
                            {
                                expanded == index ? <IconChevronUp className="h-6 w-6" /> : <IconChevronDown className="h-6 w-6 " />
                            }
                        </div>
                    </div>
                    <div className={`text-justify text-sm text-basetext px-4 overflow-hidden transition-all ease-in-out duration-300 ${expanded == index ? ' max-h-[400px] px-4 py-4' : 'max-h-0'}`}>
                        {
                            item == 'Drinks' && <div>
                                {drinkStats.map((drink, index) => {
                                    return <div key={index} className="border-b border-gray-200 py-4">
                                        <div className="flex justify-between items-center">
                                            <div className="text-lg font-semibold">{drink.drinkObj?.name ?? drink.drink}</div>
                                            <div className="flex space-x-2">
                                                <div className="text-sm text-basetext bg-yellow-500 px-4 py-[2px] rounded-lg">{drink.count}x</div>
                                                <div className="text-sm text-basetext bg-blue-500 px-4 py-[2px] rounded-lg">{drink.count * ((drink.drinkObj?.ml ?? 0) / 1000)} Liter Total</div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-basetext">
                                            {Object.keys(drink.leader).map((username, index) => {
                                                return <div key={index} className="flex justify-between items-center">
                                                    <div>{username}</div>
                                                    <div className="flex space-x-2">
                                                        <div>{drink.leader[username]}x</div>
                                                        <div>{drink.leader[username] * (drink.drinkObj?.ml ?? 0) / 1000} Liter</div>
                                                    </div>
                                                </div>
                                            })}
                                        </div>
                                    </div>
                                })}
                            </div>
                        }
                        {
                            item == 'Users' && <div>
                                {userStats.map((user, index) => {
                                    return <div key={index} className="border-b border-gray-200 py-4">
                                        <div className="flex justify-between items-center">
                                            <div className="text-lg font-semibold">{user.user}</div>
                                            <div className="flex space-x-2">
                                                <div className="text-sm text-basetext bg-green-500 px-4 py-[2px] rounded-lg">{userPromille[user.user]} Promille</div>
                                                <div className="text-sm text-basetext bg-yellow-500 px-4 py-[2px] rounded-lg">{user.count}x</div>
                                                <div className="text-sm text-basetext bg-blue-500 px-4 py-[2px] rounded-lg">{
                                                    Object.keys(user.leader).reduce((acc, drink) => {
                                                        acc += user.leader[drink] * (knownEans[drink as keyof typeof knownEans]?.ml ?? 0) / 1000
                                                        return acc
                                                    }, 0)
                                                } Liter Total</div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-basetext">
                                            {Object.keys(user.leader).map((drink, index) => {
                                                return <div key={index} className="flex justify-between items-center">
                                                    <div>{knownEans[drink as keyof typeof knownEans]?.name ?? drink}</div>
                                                    <div className="flex space-x-2">
                                                        <div>{user.leader[drink]}x</div>
                                                        <div>{user.leader[drink] * (knownEans[drink as keyof typeof knownEans]?.ml ?? 0) / 1000} Liter</div>
                                                    </div>
                                                </div>
                                            })}
                                        </div>
                                    </div>
                                })}
                            </div>
                        }
                        {
                            item == 'Log' && <div>
                                {logStats.map((item, index) => {
                                    return <div key={index} className="border-b border-gray-200 py-4">
                                        <div className="flex justify-between items-center">
                                            <div className="text-lg font-semibold">{item.drinkObj?.name ?? item.ean}</div>
                                            <div className="text-sm text-basetext">{item.username}</div>
                                            <div className="text-sm text-basetext">{item.timestamp}</div>
                                        </div>
                                    </div>
                                })}
                            </div>
                        }
                    </div>
                </div>
            }
            )}
        </div>
    </>)
}