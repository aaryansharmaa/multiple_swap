// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWETH9 {
    function deposit() external payable;
    function transfer(address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
}

contract SwapMultipleTokens {
    ISwapRouter public immutable swapRouter;
    address public immutable WETH_ADDRESS;
    address public immutable USDC_ADDRESS;

    event SwapInitiated(uint256 amountMaticIn, uint256 amountWethIn, uint256 amountOutMin, address recipient, uint256 deadline);
    event SwapMaticForUsdc(uint256 amountMaticIn, uint256 usdcOutMatic);
    event SwapWethForUsdc(uint256 amountWethIn, uint256 usdcOutWeth);

    constructor(ISwapRouter _swapRouter, address _wethAddress, address _usdcAddress) {
        swapRouter = _swapRouter;
        WETH_ADDRESS = _wethAddress;
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

        // Wrap MATIC to WMATIC and swap WMATIC for USDC
        if (amountMaticIn > 0) {
            IWETH9(WETH_ADDRESS).deposit{value: amountMaticIn}();
            IWETH9(WETH_ADDRESS).approve(address(swapRouter), amountMaticIn);

            ISwapRouter.ExactInputSingleParams memory paramsMatic = ISwapRouter.ExactInputSingleParams({
                tokenIn: WETH_ADDRESS,
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

        // Swap WETH for USDC
        if (amountWethIn > 0) {
            require(IERC20(WETH_ADDRESS).transferFrom(msg.sender, address(this), amountWethIn), "WETH transfer failed");
            require(IERC20(WETH_ADDRESS).approve(address(swapRouter), amountWethIn), "WETH approve failed");

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

        IERC20(USDC_ADDRESS).transfer(recipient, totalUsdcOut);
    }
}
