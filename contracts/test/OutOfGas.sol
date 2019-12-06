contract OutOfGas {
    uint public seq;

    function loop () public {
        while (true) {
            seq++;
        }
    }
}
