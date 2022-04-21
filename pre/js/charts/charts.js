//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_ANAG_PRIM_3 = '#9E3515';
let tooltip = d3.select('#tooltip');

export function initChart(iframe) {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_economia_3_2/main/data/brecha_genero_pensiones_europa_v2.csv', function(error,data) {
        if (error) throw error;

        // sort data
        data.sort(function(b, a) {
            return +a.Value - +b.Value;
        });

        //Desarrollo del gráfico
        let currentType = 'viz';

        let margin = {top: 5, right: 10, bottom: 20, left: 100},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // X axis
        let x = d3.scaleLinear()
            .domain([ 0, 50 ])
            .range([ 0, width]);
        
        let xAxis = function(g) {
            g.call(d3.axisBottom(x).ticks(4));
            svg.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 0) {
                                return 'line-special';
                            }
                        })
                        .attr('y1', '0%')
                        .attr('y2', `-${height}`)
                });
            });
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add Y axis
        let y = d3.scaleBand()
            .range([ 0, height ])
            .domain(data.map(function(d) { return d.GEO; }))
            .padding(0.25);

        let yAxis = function(g) {
            g.call(d3.axisLeft(y));
            g.call(function(g){g.selectAll('.tick line').remove()});
            g.call(function(g){g.select('.domain').remove()});
        }

        svg.append("g")
            .call(yAxis);

        function initViz() {
            // Barras
            svg.selectAll("bars")
                .data(data)
                .enter()
                .append("rect")
                .attr('class', 'rect')
                .attr("fill", function(d) {
                    if (d.GEO == 'España' || d.GEO == 'UE-27') {
                        return COLOR_ANAG_PRIM_3;
                    } else {
                        return COLOR_PRIMARY_1;
                    }
                })
                .attr("y", function(d) { return y(d.GEO); })
                .attr("height", y.bandwidth())
                .attr("x", function(d) { return x(0); })            
                .attr("width", function(d) { return 0; })
                .on('mouseover', function(d,i,e) {
                    //Opacidad de las barras
                    let bars = svg.selectAll('.rect');  
                    bars.each(function() {
                        this.style.opacity = '0.4';
                    });
                    this.style.opacity = '1';

                    //Texto
                    let html = '';
                    if (d.GEO == 'UE-27') {
                        html = '<p class="chart__tooltip--title">' + d.GEO + '</p>' + 
                            '<p class="chart__tooltip--text">El porcentaje de brecha en las pensiones en la Unión Europea es de un <b>' + numberWithCommas3(parseFloat(d.Value).toFixed(1)) + ' %</b> en favor de los hombres</p>';
                    } else {
                        html = '<p class="chart__tooltip--title">' + d.GEO + '</p>' + 
                            '<p class="chart__tooltip--text">El porcentaje de brecha en las pensiones en este país es de un <b>' + numberWithCommas3(parseFloat(d.Value).toFixed(1)) + ' %</b> en favor de los hombres</p>';
                    }                    
            
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let bars = svg.selectAll('.rect');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip);
                })
                .transition()
                .duration(2000)
                .attr("width", function(d) { return x(+d.Value); })
        }

        function animateChart() {
            svg.selectAll(".rect")
                .attr("x", function(d) { return x(d.GEO); })
                .attr("width", x.bandwidth())
                .attr("y", function(d) { return y(0); })            
                .attr("height", function(d) { return 0; })
                .transition()
                .duration(2000)            
                .attr("y", function(d) { return y(+d.Value); })            
                .attr("height", function(d) { return height - y(+d.Value); });        
        }

        ///// CAMBIO
        function setChart(type) {
            if(type != currentType) {
                if(type == 'viz') {
                    //Cambiamos color botón
                    document.getElementById('data_map').classList.remove('active');
                    document.getElementById('data_viz').classList.add('active');
                    //Cambiamos gráfico
                    document.getElementById('map').classList.remove('active');
                    document.getElementById('viz').classList.add('active');
                } else {
                    //Cambiamos color botón
                    document.getElementById('data_map').classList.add('active');
                    document.getElementById('data_viz').classList.remove('active');
                    //Cambiamos gráfico
                    document.getElementById('viz').classList.remove('active');
                    document.getElementById('map').classList.add('active');
                }
            }            
        }

        /////
        /////
        // Resto - Chart
        /////
        /////
        initViz();

        document.getElementById('data_viz').addEventListener('click', function() {            
            //Cambiamos gráfico
            setChart('viz');
            //Cambiamos valor actual
            currentType = 'viz';
        });

        document.getElementById('data_map').addEventListener('click', function() {
            //Cambiamos gráfico
            setChart('map');
            //Cambiamos valor actual
            currentType = 'map';
        });

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();
        });

        //////
        ///// Resto
        //////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_economia_3_2','brecha_genero_pensiones');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('brecha_genero_pensiones');

        //Captura de pantalla de la visualización
        setChartCanvas();      

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('brecha_genero_pensiones');
        });

        //Altura del frame
        setChartHeight(iframe);        
    });

    
}