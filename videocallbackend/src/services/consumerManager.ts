import * as mediasoup from "mediasoup";

export class ConsumerManager {
    /**
     * Create a Consumer for a peer to consume from a producer
     * Based on official MediaSoup demo pattern
     */
    async createConsumer({
        consumerSocket,
        producerSocket, 
        producer,
        mediasoupRouter
    }: {
        consumerSocket: any;
        producerSocket: any;
        producer: mediasoup.types.Producer;
        mediasoupRouter: mediasoup.types.Router;
    }) {
        console.log(`[ConsumerManager] Creating consumer for producer ${producer.id}`);

        // Check if consumer peer can consume this producer
        if (
            !consumerSocket.data.rtpCapabilities ||
            !mediasoupRouter.canConsume({
                producerId: producer.id,
                rtpCapabilities: consumerSocket.data.rtpCapabilities
            })
        ) {
            console.warn(`[ConsumerManager] Cannot create consumer - capabilities mismatch`);
            return null;
        }

        // Find the consuming transport
        const transport = Array.from(consumerSocket.data.transports.values())
            .find((t: any) => t.appData.consuming);

        if (!transport) {
            console.warn('[ConsumerManager] No consuming transport found');
            return null;
        }

        try {
            // Create the Consumer in paused mode (critical!)
            const consumer = await (transport as mediasoup.types.WebRtcTransport).consume({
                producerId: producer.id,
                rtpCapabilities: consumerSocket.data.rtpCapabilities,
                enableRtx: true,
                paused: true,
                ignoreDtx: true
            });

            // Store the consumer
            consumerSocket.data.consumers.set(consumer.id, consumer);

            // Set up consumer events
            consumer.on('transportclose', () => {
                consumerSocket.data.consumers.delete(consumer.id);
            });

            consumer.on('producerclose', () => {
                consumerSocket.data.consumers.delete(consumer.id);
                consumerSocket.emit('consumerClosed', { consumerId: consumer.id });
            });

            consumer.on('producerpause', () => {
                consumerSocket.emit('consumerPaused', { consumerId: consumer.id });
            });

            consumer.on('producerresume', () => {
                consumerSocket.emit('consumerResumed', { consumerId: consumer.id });
            });

            consumer.on('score', (score: any) => {
                consumerSocket.emit('consumerScore', { consumerId: consumer.id, score });
            });

            // Send newConsumer event to frontend
            consumerSocket.emit('newConsumer', {
                peerId: producerSocket.id,
                producerId: producer.id,
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type,
                appData: producer.appData,
                producerPaused: consumer.producerPaused
            });

            // Resume the consumer after frontend setup
            await consumer.resume();

            console.log(`[ConsumerManager] Consumer ${consumer.id} created successfully for producer ${producer.id}`);
            
            return consumer;
        } catch (error) {
            console.error(`[ConsumerManager] Failed to create consumer: ${error}`);
            return null;
        }
    }

    /**
     * Create consumers for a new peer joining
     */
    async createConsumersForNewPeer(newSocket: any, allSockets: Map<string, any>, mediasoupRouter: mediasoup.types.Router) {
        console.log(`[ConsumerManager] Creating consumers for new peer ${newSocket.id}`);

        for (const [socketId, socket] of allSockets) {
            if (socketId === newSocket.id) continue;

            // Create consumers for all producers of this peer
            if (socket.data?.producers) {
                for (const producer of socket.data.producers.values()) {
                    await this.createConsumer({
                        consumerSocket: newSocket,
                        producerSocket: socket,
                        producer,
                        mediasoupRouter
                    });
                }
            }
        }
    }

    /**
     * Create consumers for existing peers when new producer is created
     */
    async createConsumersForNewProducer(producerSocket: any, producer: mediasoup.types.Producer, allSockets: Map<string, any>, mediasoupRouter: mediasoup.types.Router) {
        console.log(`[ConsumerManager] Creating consumers for new producer ${producer.id}`);

        for (const [socketId, socket] of allSockets) {
            if (socketId === producerSocket.id) continue;

            await this.createConsumer({
                consumerSocket: socket,
                producerSocket: producerSocket,
                producer,
                mediasoupRouter
            });
        }
    }
}

export const consumerManager = new ConsumerManager();