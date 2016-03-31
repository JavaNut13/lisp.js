(defn rand [min max] 
  (def num (+ (* (Math.random) (- max min)) min))
  (Math.floor num)
)

(console.log "Things")

(console.log (if (rand 0 3) (* 4 (+ 4 5)) 8)