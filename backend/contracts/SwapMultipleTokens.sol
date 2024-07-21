// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWMATIC {
    function deposit() external payable;
    function transfer(address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
}

contract SwapMultipleTokens {
    ISwapRouter public immutable swapRouter;
    address public immutable WMATIC_ADDRESS;
    address public immutable WETH_ADDRESS;
    address public immutable USDC_ADDRESS;

    event SwapInitiated(uint256 amountMaticIn, uint256 amountWethIn, uint256 amountOutMin, address recipient, uint256 deadline);
    event SwapMaticForUsdc(uint256 amountMaticIn, uint256 usdcOutMatic);
    event SwapWethForUsdc(uint256 amountWethIn, uint256 usdcOutWeth);
    event Debug(string message, uint256 value);

    constructor(ISwapRouter _swapRouter, address _wMaticAddress, address _wEthAddress, address _usdcAddress) {
        swapRouter = _swapRouter;
        WMATIC_ADDRESS = _wMaticAddress;
        WETH_ADDRESS = _wEthAddress;
        USDC_ADDRESS = _usdcAddress;
    }

    function swapMaticAndWethForUsdc(
        uint256 amountMaticIn,
        uint256 amountWethIn,
        uint256 amountOutMin,
        address recipient,
        uint256 deadline
    ) external payable {
        require(msg.value == amountMaticIn, "Incorrect MATIC amount sent");
        emit SwapInitiated(amountMaticIn, amountWethIn, amountOutMin, recipient, deadline);

        uint256 totalUsdcOut = 0;

    
        if (amountMaticIn > 0) {
            IWMATIC(WMATIC_ADDRESS).deposit{value: amountMaticIn}();
            IWMATIC(WMATIC_ADDRESS).approve(address(swapRouter), amountMaticIn);
            emit Debug("MATIC deposited and approved as WMATIC", amountMaticIn);

            ISwapRouter.ExactInputSingleParams memory paramsMatic = ISwapRouter.ExactInputSingleParams({
                tokenIn: WMATIC_ADDRESS,
                tokenOut: USDC_ADDRESS,
                fee: 3000,
                recipient: address(this),
                deadline: deadline,
                amountIn: amountMaticIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

            uint256 usdcOutMatic = swapRouter.exactInputSingle(paramsMatic);
            emit SwapMaticForUsdc(amountMaticIn, usdcOutMatic);
            totalUsdcOut += usdcOutMatic;
        }

        if (amountWethIn > 0) {
            require(IERC20(WETH_ADDRESS).transferFrom(msg.sender, address(this), amountWethIn), "WETH transfer failed");
            require(IERC20(WETH_ADDRESS).approve(address(swapRouter), amountWethIn), "WETH approve failed");
            emit Debug("WETH transferred and approved", amountWethIn);

            ISwapRouter.ExactInputSingleParams memory paramsWeth = ISwapRouter.ExactInputSingleParams({
                tokenIn: WETH_ADDRESS,
                tokenOut: USDC_ADDRESS,
                fee: 3000,
                recipient: address(this),
                deadline: deadline,
                amountIn: amountWethIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

            uint256 usdcOutWeth = swapRouter.exactInputSingle(paramsWeth);
            emit SwapWethForUsdc(amountWethIn, usdcOutWeth);
            totalUsdcOut += usdcOutWeth;
        }

        require(totalUsdcOut >= amountOutMin, "Insufficient USDC received");
        emit Debug("Total USDC out", totalUsdcOut);

        IERC20(USDC_ADDRESS).transfer(recipient, totalUsdcOut);
    }
}
