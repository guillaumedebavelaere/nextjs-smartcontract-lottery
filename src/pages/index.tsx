import Head from "next/head"
import Image from "next/image"
import { Inter } from "next/font/google"
import styles from "@/styles/Home.module.css"
import Header from "@/components/Header"
import LotteryEntrance from "@/components/LotteryEntrance"
import { useMoralis } from "react-moralis"
import { contractAddresses } from "../../constants"
const inter = Inter({ subsets: ["latin"] })

export default function Home() {
    const addresses: Record<string, string> = contractAddresses
    const supportedChains = Object.keys(addresses) as string[]
    const { isWeb3Enabled, chainId } = useMoralis()
    const isChainedSupported = chainId != null && supportedChains.includes(parseInt(chainId).toString())

    return (
        <>
            <Head>
                <title>Smart Contract Lottery</title>
                <meta name="description" content="Our Smart Contract Lottery" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header />
            {isWeb3Enabled ? (
                <div>
                    {isChainedSupported ? (
                        <div className="flex flex-row">
                            <LotteryEntrance />
                        </div>
                    ) : (
                        <div>{`Please switch to a supported chainId. The supported Chain Ids are: ${supportedChains}`}</div>
                    )}
                </div>
            ) : (
                <div>Please connect to a Wallet</div>
            )}
            <main className={styles.main}>Hello</main>
        </>
    )
}
