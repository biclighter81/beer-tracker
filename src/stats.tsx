import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { useEffect, useMemo, useState } from "preact/hooks"
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)
import { Line } from 'react-chartjs-2'

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


    const calculatePromille = (user: string, time?: number) => {
        const timeInSeconds = (time ?? Date.now()) / 1000;
        const consumedDrinks = stats.filter(drink => drink.timestamp <= (time ?? Date.now()) && drink.username === user)
            .sort((a, b) => a.timestamp - b.timestamp);

        let consumedAlcohol = 0;
        let lastDrinkTime;

        for (const drink of consumedDrinks) {
            const drinkObject = knownEans[drink.ean as keyof typeof knownEans];
            if (drinkObject) {
                const alcoholContent = drinkObject.alcohol * (drinkObject.ml / 1000);
                const drinkTimeInSeconds = drink.timestamp / 1000;
                const elapsedTime = (timeInSeconds - drinkTimeInSeconds) / 3600; // in hours

                // Calculate the eliminated alcohol for this drink
                const eliminationRatePerHour = 0.015; // 0.015 per hour per kg of body weight
                const userWeight = 85; // or fetch from user profile
                const eliminatedAlcohol = eliminationRatePerHour * userWeight * elapsedTime;

                consumedAlcohol += alcoholContent;
                consumedAlcohol -= Math.min(eliminatedAlcohol, alcoholContent); // Ensure not to subtract more than available

                lastDrinkTime = drinkTimeInSeconds;
            }
        }

        // Calculate BAC (promille in this case, conversion factor might be needed)
        const userWeight = 85; // or fetch from user profile
        const BAC = (consumedAlcohol / userWeight) * 10; // Convert to promille

        return BAC;
    }
    const getColorPalette = (numColors: number) => {
        const colors = [];
        for (let i = 0; i < numColors; i++) {
            const hue = (i * 360 / numColors) % 360;
            colors.push(`hsl(${hue}, 100%, 50%)`);
        }
        return colors;
    };
    const dayPromilleDatapoints = useMemo(() => {
        //generte 24 hours of promille data
        const datapoints = Array.from({ length: 48 }, (_, i) => {
            const time = Date.now() - i * 1800000
            return {
                time,
            }
        })
        const uniqueUsers = [...new Set(stats.map(item => item.username))]
        return uniqueUsers.reduce((acc, user) => {
            acc[user] = datapoints.map((datapoint) => {
                return {
                    time: datapoint.time,
                    promille: calculatePromille(user, datapoint.time)
                }
            })
            return acc
        }, {} as Record<string, { time: number, promille: number }[]>)
    }, [stats])
    const colors = getColorPalette(Object.keys(dayPromilleDatapoints).length);
    const getPromilleColor = (promille: number) => {
        if (promille < 1.2)
            return 'bg-red-500'
        else if (promille >= 1.2 && promille < 2)
            return 'bg-yellow-500'
        else if (promille >= 2)
            return 'bg-green-500'
    }
    const userPromille = useMemo(() => {
        const uniqueUsers = [...new Set(stats.map(item => item.username))]
        return uniqueUsers.reduce((acc, user) => {
            acc[user] = calculatePromille(user)
            return acc
        }, {} as Record<string, number>)
    }, [stats])
    const [expanded, setExpanded] = useState(-1)
    useEffect(() => {
        fetch('https://n8n.rimraf.de/webhook/track-drink-stats').then(res => res.json()).then((data) => {
            setStats(data.map((i: any) => ({ ...i, timestamp: Number(i.timestamp) })))
        })
    }, [])
    return (<>
        <div className="w-full px-4 py-4">
            <a href={'/'}>
                <button className="bg-blue-500 w-full px-4 py-4 text-white font-bold uppercase rounded-md">Back to drinking!</button>
            </a>
        </div>
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
                    <div className={`text-justify text-sm text-basetext px-4 overflow-hidden transition-all ease-in-out duration-300 ${expanded == index ? ' max-h-[400px] overflow-y-auto px-4 py-4' : 'max-h-0'}`}>
                        {
                            item == 'Drinks' && <div>
                                {drinkStats.map((drink, index) => {
                                    return <div key={index} className="border-b border-gray-200 py-4">
                                        <div className="flex justify-between items-center">
                                            <div className="text-lg font-semibold">{drink.drinkObj?.name ?? drink.drink}</div>
                                            <div className="flex space-x-2">
                                                <div className="text-sm text-white bg-yellow-500 px-4 py-[2px] rounded-lg">{drink.count}x</div>
                                                <div className="text-sm text-white bg-blue-500 px-4 py-[2px] rounded-lg">{(drink.count * ((drink.drinkObj?.ml ?? 0) / 1000)).toFixed(2)} Liter Total</div>
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
                                        <div className={`text-2xl uppercase text-center font-bold text-white  px-4 py-[2px] rounded-lg marker mb-2 ${getPromilleColor(userPromille[user.user])}`}>{userPromille[user.user].toFixed(2)} Promille</div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-lg font-semibold">{user.user}</div>
                                            <div className="flex space-x-2">
                                                <div className="text-sm text-white bg-yellow-500 px-4 py-[2px] rounded-lg">{user.count}x</div>
                                                <div className="text-sm text-white bg-blue-500 px-4 py-[2px] rounded-lg">{
                                                    Object.keys(user.leader).reduce((acc, drink) => {
                                                        acc += user.leader[drink] * (knownEans[drink as keyof typeof knownEans]?.ml ?? 0) / 1000
                                                        return acc
                                                    }, 0).toFixed(2)
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
            <div>
                <Line
                    data={{
                        labels: dayPromilleDatapoints[Object.keys(dayPromilleDatapoints)[0]]?.map((item) => new Date(item.time).toLocaleTimeString()).reverse() ?? [],
                        datasets: Object.keys(dayPromilleDatapoints).map((user, idx) => {
                            return {
                                label: user,
                                data: dayPromilleDatapoints[user].map((item) => item.promille).reverse(),
                                fill: false,
                                backgroundColor: colors[idx],
                                borderColor: colors[idx],
                                tension: 0.4,
                            }
                        })
                    }}
                    options={{
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }}
                />
            </div>
            {new Intl.DateTimeFormat('de-DE', {
                year: 'numeric',
                month: 'long',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).format(Date.now())}
        </div >
    </>)
}