import { useEffect, useState } from "preact/hooks";
import Scanner from "./components/Scanner";
import { IconDeviceFloppy } from "@tabler/icons-react";
export default function Home({ knownEans, setKnownEans }: {
    knownEans: {
        [key: string]: {
            name: string,
            alcohol: number,
            ml: number
        }

    },
    setKnownEans: Function
}) {
    const [camera, setCamera] = useState(false);
    const [result, setResult] = useState(null);

    const [username, setUsername] = useState("");
    const [newDrink, setNewDrink] = useState({
        name: "",
        alcohol: 0,
        ml: 0
    });

    useEffect(() => {
        setUsername(localStorage.getItem('username') ?? '')
    }, [])



    const onDetected = (res: any) => {
        if (result) return;
        setCamera(false);
        setResult(res);
    };

    const handleDrink = async () => {
        const res = await fetch(`https://n8n.rimraf.de/webhook/track-drink`, {
            method: 'POST',
            body: JSON.stringify({
                ean: result,
                user: username,
                timestamp: new Date().toISOString()
            })
        })
        const data = await res.json()
        console.log(data)
    }

    const handleAddDrink = async () => {
        const res = await fetch(`https://n8n.rimraf.de/webhook/add-drink`, {
            method: 'POST',
            body: JSON.stringify({
                ean: result,
                name: newDrink.name,
                alcohol: newDrink.alcohol,
                ml: newDrink.ml
            })
        })
        if (res.ok) {
            setKnownEans({ ...knownEans, [result as unknown as string]: newDrink })
        }
        const data = await res.json()
        console.log(data)
    }

    return (
        <div className="px-4 py-4">
            {
                result && <div className="absolute top-0 right-0 left-0 bottom-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <div className="bg-white rounded-md h-[500px] w-[400px] px-4 py-4 flex justify-between flex-col">
                        <h1 className="text-center text-2xl uppercase font-bold">Drink detected!</h1>
                        <div>
                            {
                                knownEans[result] ? (
                                    <>
                                        <p className="text-center text-lg font-semibold">EAN: {result}</p>
                                        <p className="text-center text-lg font-semibold">Drink: {knownEans[result].name}</p>
                                    </>)
                                    : (
                                        <div>
                                            <h3 className="text-red-500 uppercase text-center font-semibold mb-2">Drink not found!<br />{result}</h3>
                                            <input value={newDrink.name} onChange={(e) => setNewDrink({ ...newDrink, name: e.currentTarget.value })} placeholder={"Name"} className="w-full bg-gray-200 border border-gray-300 rounded-md px-4 py-2 text-black uppercase mb-4" />
                                            <input value={newDrink.alcohol} type="number" onChange={(e) => setNewDrink({ ...newDrink, alcohol: Number(e.currentTarget.value) })} placeholder={"Alcohol in %"} className="w-full bg-gray-200 border border-gray-300 rounded-md px-4 py-2 text-black uppercase mb-4" />
                                            <input value={newDrink.ml} type="number" onChange={(e) => setNewDrink({ ...newDrink, ml: Number(e.currentTarget.value) })} placeholder={"Milliliter"} className="w-full bg-gray-200 border border-gray-300 rounded-md px-4 py-2 text-black uppercase mb-4" />
                                        </div>
                                    )
                            }
                        </div>
                        <div>
                            <button className="bg-blue-500 rounded-md px-4 py-2 text-white w-full uppercase font-bold mb-4" onClick={async () => {
                                if (newDrink.name && newDrink.alcohol != null && newDrink.ml != null) {
                                    console.log(newDrink)
                                    await handleAddDrink()
                                    setNewDrink({
                                        name: "",
                                        alcohol: 0,
                                        ml: 0
                                    })
                                }
                                handleDrink()
                                setResult(null)
                            }}>
                                Drink it!
                            </button>
                            <button className="bg-gray-500 z-50 rounded-md px-4 py-2 text-white w-full uppercase font-bold mb-4" onClick={() => {
                                setResult(null)
                            }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            }
            <div className="flex space-x-2">
                <input value={username} onChange={(e) => setUsername(e.currentTarget.value)} placeholder={"Who are you?"} className="w-full bg-gray-200 border border-gray-300 rounded-md px-4 py-2 text-black uppercase mb-4" />
                <button className="bg-blue-500 rounded-md px-4 py-2 text-white uppercase font-bold mb-4" onClick={() => {
                    localStorage.setItem('username', username.toUpperCase())
                }}>
                    <IconDeviceFloppy size={24} />
                </button>
            </div>
            <a href={"/stats"}>
                <button className={`w-full bg-teal-500 rounded-md px-4 py-2 text-white uppercase font-bold mb-4`}>
                    Show stats
                </button>
            </a>
            <button disabled={!username} className={`disabled:bg-gray-500 w-full ${camera ? 'bg-red-500' : 'bg-blue-500'} rounded-md px-4 py-2 text-white uppercase font-bold mb-4`} onClick={() => {
                setCamera(!camera)
            }}>
                {!camera ? "Track a drink!" : "Stop"}
            </button>

            {camera && <Scanner key={Math.random()} onDetected={onDetected} />}

        </div>
    );
}