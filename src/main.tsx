import './app.css'
import { render } from 'preact'
import { Router, Route } from "preact-router";
import Layout from './components/Layout.tsx';
import Home from './home.tsx';
import Stats from './stats.tsx';
import { useEffect, useState } from 'preact/hooks';


const Main = () => {
    const [knownEans, setKnownEans] = useState<{
        [key: string]: {
            name: string,
            alcohol: number,
            ml: number
        }
    }>({});
    useEffect(() => {
        fetch(`https://n8n.rimraf.de/webhook/drinks`)
            .then(res => res.json())
            .then(data => {
                setKnownEans(data.reduce((acc: any, drink: any) => {
                    acc[drink.ean] = drink
                    return acc
                }))
            })
    }, [])
    return (<><Layout>
        <Router onChange={() => {
            const mainContent = document.getElementById('main-content')
            if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'instant' })
        }}>
            <Route path="/" component={() => <Home setKnownEans={setKnownEans} knownEans={knownEans} />} />
            <Route path="/stats" component={() => <Stats setKnownEans={setKnownEans} knownEans={knownEans} />} />
            {/* 404 Path */}
            <Route default component={() => <div className="flex-grow">404</div>} />
        </Router>
    </Layout>
    </>)
}
render(<Main />, document.getElementById('app')!)