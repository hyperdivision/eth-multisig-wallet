contract OutOfGas {
    uint public seq = 0;

    function loop () public {
        while (true) {
            seq++;
        }
    }
}
