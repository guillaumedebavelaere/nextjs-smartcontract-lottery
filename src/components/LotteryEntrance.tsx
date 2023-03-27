import { useWeb3Contract } from "react-moralis"
import contractAddressesInterface, { abi, contractAddresses } from "../../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { BigNumber, ethers, ContractTransaction, ContractInterface } from "ethers"
import { Bell, useNotification } from "web3uikit"

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const addresses: contractAddressesInterface = contractAddresses
    const chainId = parseInt(chainIdHex as string).toString()
    const lotteryAddress = chainId in addresses ? addresses[chainId][0] : null

    const [entranceFee, setEntranceFee] = useState("0")
    const [numberOfPlayers, setNumberOfPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")

    const dispatch = useNotification()

    const {
        runContractFunction: enterLottery,
        isLoading,
        isFetching,
    } = useWeb3Contract({
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
        <div className="p-5">
            Hi from lottery entrance!
            {lotteryAddress ? (
                <div className="">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async function () {
                            await enterLottery({
                                onSuccess: (tx) => handleSuccess(tx as ContractTransaction),
                                onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter lottery</div>
                        )}
                    </button>
                    <div>Entrance fee {ethers.utils.formatEther(entranceFee)} </div>
                    <div>ETH Number Of Players:{numberOfPlayers}</div>
                    <div>Recent Winner: {recentWinner}</div>
                </div>
            ) : (
                <div>No Lottery address detected</div>
            )}
        </div>
    )
}
