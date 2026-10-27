# Coste de la vida — España y Comunidad de Madrid

Libro: `03_Coste_de_la_Vida.xlsx` · Consulta: 2026-10-21 · Último IPC: **septiembre 2026**

## Qué contiene
| Hoja | Contenido | Cobertura |
|---|---|---|
| `Resumen_Coste_Vida` | Indicadores clave de precios, gasto, renta y poder adquisitivo | último dato |
| `IPC_General_Anual` | Inflación dic/dic España y Madrid + índice acumulado y media geométrica | 2002–2025 |
| `IPC_2026_Mensual` | IPC general interanual mensual | ene–sep 2026 |
| `IPC_Madrid_Grupos` | IPC de Madrid por 14 grupos ECOICOP v2 (tasa anual) | ago-2025 a sep-2026 |
| `HICP_Espana_Grupos` | IPC armonizado de España por grupos (media anual) con acumulado y volatilidad | 2005–2025 |
| `EPF_Madrid_2018_2023`, `EPF_Nacional_2018_2023` | Gasto medio por hogar/persona y % por grupo (EPF) | 2018–2023 |
| `EPF_Comparativa_2023` | Madrid vs España por grupo, pesos, variación 2018–2023 | 2023 |
| `Cesta_Necesidades_Aprox` | **Proxy propio** de inflación de necesidades básicas en Madrid | sep-2025, sep-2026 |
| `Salario_vs_IPC` | Salario medio/mediano nominal y real frente al IPC (2008=100) | 2008–2024 |
| `ECV_Renta_Pobreza` | Renta neta media y AROPE, Madrid y España | 2020–2025 |

## Cifras clave
| Indicador | España | Madrid |
|---|---|---|
| IPC general interanual sep-2026 | 4,9 % | 5,3 % |
| IPC dic/dic 2025 | 2,9 % | 3,7 % |
| Inflación acumulada 2002–2025 | 72,3 % | 70,2 % |
| Gasto medio por hogar 2023 | 32.616,66 € | 37.360,47 € |
| % gasto en vivienda y suministros 2023 | 31,8 % | 35,0 % |
| % gasto en alimentos 2023 | 16,4 % | 14,0 % |
| Renta neta media por persona 2025 | 15.620 € | 18.169 € |
| AROPE 2025 | 25,7 % | 19,4 % |
| Salario medio real 2024 (2008=100) | 99,9 | 102,6 |

- Grupo con mayor inflación en Madrid en sep-2026: **Transporte, +11,5 %**; vivienda y suministros +5,9 %.
- Proxy de necesidades básicas (alimentos, vivienda y suministros, sanidad, transporte, enseñanza ≈ 66 % del gasto): **≈ 5,96 %** anual en sep-2026 (5,56 % en sep-2025), frente al 5,3 % del IPC general de Madrid.

## "Cesta básica": qué hay y qué no
No existe una cesta básica oficial única en España. Lo que se ofrece: IPC por grupos (especialmente alimentos y vivienda/suministros), EPF (cuánto gastan los hogares) y el proxy de `Cesta_Necesidades_Aprox` (elaboración propia, ponderado con la EPF de Madrid; no usar como cifra oficial).

## Límites
- IPC por grupo de Madrid solo 14 meses; sin histórico por grupo, subclase, provincia, ni precios de productos concretos (pan, leche, huevos…).
- INE pasó a base 2025 y ECOICOP v2 en 2026 (14 grupos); EPF (12 grupos, v1) y HICP no coinciden exactamente.
- HICP sin el grupo CP08 (Comunicaciones): Eurostat devolvió HTTP 429 y no se reintentó.
- EPF: último año 2023, importes nominales. Sin EPF por todas las CCAA ni por quintiles.
- ECV: años de encuesta; la renta es del año anterior. Sin carencia material por CCAA, tenencia ni sobrecarga de vivienda.
- Salario_vs_IPC compara salario anual medio con IPC dic/dic: aproximación.
- El grupo vivienda de la EPF puede incluir alquiler imputado: verificar en la metodología del INE.

## Pendiente
IPC por provincia y subclases, energía (electricidad, gas, carburantes), niveles de precios comparados (Eurostat), EPF por CCAA y quintiles.
