import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { BigNumber, ethers, ContractTransaction, ContractInterface } from "ethers"
import { Bell, useNotification } from "web3uikit"

interface contractAddressesInterface {
    [key: string]: string[]
}

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const addresses: contractAddressesInterface = contractAddresses
    const chainId = parseInt(chainIdHex as string).toString()
    const lotteryAddress = chainId in addresses ? addresses[chainId][0] : null

    const [entranceFee, setEntranceFee] = useState("0")
    const [numberOfPlayers, setNumberOfPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")

    const dispatch = useNotification()

    const { runContractFunction: enterLottery } = useWeb3Contract({
        abi,
        contractAddress: lotteryAddress as string,
        functionName: "enterLottery",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress as string,
        functionName: "getEntranceFee",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress as string,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress as string,
        functionName: "getRecentWinner",
        params: {},
    })

    const updateUI = async (): Promise<void> => {
        const entranceFeeFromCall = ((await getEntranceFee()) as BigNumber).toString()
        setEntranceFee(entranceFeeFromCall)

        const numberOfPlayersFromCall = ((await getNumberOfPlayers()) as BigNumber).toString()
        setNumberOfPlayers(numberOfPlayersFromCall)

        const recentWinnerFromCall = (await getRecentWinner()) as string
        setRecentWinner(recentWinnerFromCall)
    }

    const addWinnerPickedListener = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        // await provider.send('eth_requestAccounts', [])
        const signer = provider.getSigner()
        const contract = new ethers.Contract(
            lotteryAddress as string,
            abi as ContractInterface,
            signer
        )

        contract.on("WinnerPicked", (winner) => {
            console.log("event triggered!" + winner)
            setRecentWinner(winner)
        })
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
            addWinnerPickedListener()
        }
    }, [isWeb3Enabled])

    const handleSuccess = async (tx: ContractTransaction) => {
        await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
    }

    const handleNewNotification = (tx: any) => {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Tx notification",
            position: "topR",
            icon: <Bell fontSize={20} />,
        })
    }

    return (
        <div>
            Hi from lottery entrance!
            {lotteryAddress ? (
                <div>
                    <button
                        onClick={async function () {
                            await enterLottery({
                                onSuccess: (tx) => handleSuccess(tx as ContractTransaction),
                                onError: (error) => console.log(error),
                            })
                        }}
                    >
                        Enter lottery
                    </button>
                    Entrance fee <div>{ethers.utils.formatEther(entranceFee)} ETH</div>
                    Number Of Players: <div>{numberOfPlayers}</div>
                    Recent Winner: <div>{recentWinner}</div>
                </div>
            ) : (
                <div>No Lottery address detected</div>
            )}
        </div>
    )
}
