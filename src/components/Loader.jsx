import { useState, useEffect } from "react";
import Lottie from "react-lottie";
import cookingLoader from "../assets/loader.json";

const Loader = ({ showMessages = false }) => {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: cookingLoader,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    const messages = [
        "Don't refresh this window, it may take some time",
        "Cooking up the perfect recipe for you...",
        "Blending ideas into a masterpiece just for you...",
        "Preparing a delicious idea tailored just for you...",
        "Hang tight! This might take 1-2 minutes to perfect..."
    ];

    const [currentMessage, setCurrentMessage] = useState(messages[0]);

    useEffect(() => {
        if (showMessages) {
            const interval = setInterval(() => {
                setCurrentMessage((prev) => {
                    const index = messages.indexOf(prev);
                    return messages[(index + 1) % messages.length];
                });
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [showMessages]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <Lottie
                    options={defaultOptions}
                    height={200}
                    width={200}
                    
                />
                {showMessages && (
                    <p className="m-4 text-lg text-white font-semibold animate-pulse text-center max-w-md">
                        {currentMessage}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Loader;
