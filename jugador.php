<?php
class jugador
{
  public $nombreJugador;
  public $listoJugador;

  public function __construct(string $nombre, bool $estado = false)
  {
    $this->nombreJugador = $nombre;
    $this->listoJugador = $estado;
  }

  public function __get($property)
    {
        if (property_exists($this, $property)) {
            return $this->$property;
        }
    }

    public function __set($property, $value)
    {
        if (property_exists($this, $property)) {
            $this->$property = $value;
        }

        return $this;
    }

    public function getJSON() {
        $json = '{"nombre":"' . $this->nombreJugador . '","estatus":"' . $this->listoJugador . '"}';
        return $json;
    }
}