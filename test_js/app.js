console.log("Program start");

setTimeout(() => {
    console.log("Inside timeout"); // Set breakpoint here
    debugger; // Force stop
}, 1000);

console.log("End of script");
