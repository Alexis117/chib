'''
La solución rápida es iterar n veces por la lista de puertas, agrandando el paso cada vez. Pero es posible notar un patrón en 
las soluciones. Si analizamos un poco podemos ver que el estado final de la puerta depende de cuantas veces pasamos por cada 
puerta (si este numero es par o impar). Es posible notar que las veces que pasamos por cada puerta es igual al número de factores 
de la posicion en la lista de estos números. Para saber si este numero es par e impar solo tenemos que saber si su raiz cuadrada 
es entera. Asi logramos obtener la solucion iterando solo una vez por la longitud de la lista, es decir en O(n)'''
import math

def puertas(no_de_puertas):
    lista_de_puertas = [False for i in range(no_de_puertas)]
    step = 1
    while step <= no_de_puertas:
        for i in range(step - 1, len(lista_de_puertas), step):
            lista_de_puertas[i] = not lista_de_puertas[i]
        step += 1
    lista_de_puertas_abiertas = [i + 1 for i, item in enumerate(lista_de_puertas) if item == True]
    return len(lista_de_puertas_abiertas), lista_de_puertas_abiertas

def puertas_optimal(no_de_puertas):
    lista_de_puertas = []
    for i in range(no_de_puertas):
        if math.sqrt(i+1) == int(math.sqrt(i+1)): #Checar si el número de factores es impar y por lo tanto la puerta termina abierta
            lista_de_puertas.append(i+1)
    return len(lista_de_puertas), lista_de_puertas