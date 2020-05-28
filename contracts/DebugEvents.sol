contract DebugEvents
{
    event Debug(string message);

    modifier requireDebugModifier(bool arg, string message)
    {
        if (!arg)
        {
            Debug(message);
            return;
        }
        _;

    }

    modifier requireModifier(bool arg)
    {
        require(arg);
        _;
    }
}
