import React from "react";
import { Card, CardContent, CardTitle } from "./components/ui/card";
import { useAppOneToMany } from "./useAppOneToMany";

function NewApp() {
    const { localStreamRef, videoRefs, socket, consumerList } =
        useAppOneToMany();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent>
                    <video ref={localStreamRef} autoPlay playsInline muted />
                </CardContent>
                <CardTitle className="text-center">{socket?.id}</CardTitle>
            </Card>

            {Object.keys(consumerList).map((key, index) => (
                <Card>
                    <CardContent>
                        <video
                            key={index}
                            ref={videoRefs[index]}
                            autoPlay
                            playsInline
                            muted
                        />
                    </CardContent>
                    <CardTitle className="text-center">{key}</CardTitle>
                </Card>
            ))}
        </div>
    );
}

export default NewApp;
