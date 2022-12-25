<?php
define("INTERVAL", 5);
class repartidor
{


  public function __construct()
  {
  }

  // 5 seconds

  function repartir()
  { // Your function to run every 5 seconds
    echo "something\n";
  }

  function checkForStopFlag()
  { // completely optional
    // Logic to check for a program-exit flag
    // Could be via socket or file etc.
    // Return TRUE to stop.
    return false;
  }

  function start()
  {
    $active = true;
    $nextTime   = microtime(true) + INTERVAL; // Set initial delay

    while ($active) {
      usleep(1000); // optional, if you want to be considerate

      if (microtime(true) >= $nextTime) {
        $this->repartir();
        $nextTime = microtime(true) + INTERVAL;
      }

      // Do other stuff (you can have as many other timers as you want)

      $active = !checkForStopFlag();
    }
  }
}
