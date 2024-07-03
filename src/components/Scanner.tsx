import { useEffect } from "react";
import Quagga from "@ericblade/quagga2";

export default function Scanner({ onDetected }: { onDetected: (result: string) => void }) {
    useEffect(() => {
        Quagga.init({
            "inputStream": {
                "type": "LiveStream",
                "constraints": {
                    "width": { "min": 450 },
                    "height": { "min": 300, "max": 400 },
                    "facingMode": "environment",
                    "aspectRatio": { "min": 1, "max": 2 }
                }
            },
            "locator": {
                "patchSize": "medium",
                "halfSample": true
            },
            "numOfWorkers": 2,
            "frequency": 10,
            "decoder": {
                "readers": ["ean_reader"]
            },
            "locate": true
        }, err => {
            if (err) {
                console.log(err, "error msg");
            }
            Quagga.start();
            return () => {
                Quagga.stop()
            }
        });
        Quagga.onDetected(detected);
        return () => {
            Quagga.offDetected(detected);
            Quagga.stop()
        }
    }, []);

    const detected = (result: any) => {
        onDetected(result.codeResult.code);
    };

    return (
        // If you do not specify a target,
        // QuaggaJS would look for an element that matches
        // the CSS selector #interactive.viewport
        <div id="interactive" className="viewport" />
    );
};
